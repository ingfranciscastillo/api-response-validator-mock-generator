import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { and, count, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import {
	endpoint,
	specification,
	validationResult,
	validationRun,
} from "@/db/schema";
import { writeAuditLog } from "@/lib/audit/functions";
import { auth } from "@/lib/auth";
import { validateResponseAgainstSchema } from "./engine";
import { computeDiff } from "./response-diff";

export const sendTestRequest = createServerFn({ method: "POST" })
	.validator(
		(input: {
			method: string;
			url: string;
			headers?: Record<string, string>;
			body?: unknown;
		}) => input,
	)
	.handler(async ({ data }) => {
		const headers = getRequestHeaders();
		const session = await auth.api.getSession({ headers });
		if (!session) throw new Error("Unauthorized");

		const start = Date.now();
		const response = await fetch(data.url, {
			method: data.method,
			headers: {
				"Content-Type": "application/json",
				...data.headers,
			},
			body: data.body ? JSON.stringify(data.body) : undefined,
		});
		const latencyMs = Date.now() - start;

		const responseHeaders: Record<string, string> = {};
		response.headers.forEach((value, key) => {
			responseHeaders[key] = value;
		});

		const body = await response.json().catch(() => null);

		return {
			statusCode: response.status,
			headers: responseHeaders,
			body: body as Record<string, string> | null,
			latencyMs,
		};
	});

function extractSchema(
	responses: Record<string, unknown> | null,
	statusCode: string,
): Record<string, unknown> | null {
	const responseSchema =
		responses?.[statusCode] ??
		(responses?.default as Record<string, unknown> | undefined) ??
		null;
	if (!responseSchema) return null;
	const content = (responseSchema as Record<string, unknown>).content as
		| Record<string, unknown>
		| undefined;
	const jsonContent = content?.["application/json"] as
		| Record<string, unknown>
		| undefined;
	return (jsonContent?.schema as Record<string, unknown>) ?? null;
}

export const validateResponse = createServerFn({ method: "POST" })
	.validator(
		(input: {
			endpointId: string;
			statusCode: number;
			responseBody: unknown;
		}) => input,
	)
	.handler(async ({ data }) => {
		const headers = getRequestHeaders();
		const session = await auth.api.getSession({ headers });
		if (!session) throw new Error("Unauthorized");

		const ep = await db
			.select()
			.from(endpoint)
			.where(eq(endpoint.id, data.endpointId))
			.then((r) => r[0] ?? null);

		if (!ep) throw new Error("Endpoint not found");

		const schema = extractSchema(
			ep.responses as Record<string, unknown> | null,
			String(data.statusCode),
		);

		if (!schema) {
			return {
				outcome: "warning" as const,
				violations: [],
				diff: { entries: [], hasBreaking: false },
			};
		}

		const result = validateResponseAgainstSchema(schema, data.responseBody);
		const diffResult = computeDiff(data.responseBody, null, schema);

		return {
			outcome: result.outcome,
			violations: result.violations.map((v) => ({
				type: v.type,
				path: v.path,
				expected: v.expected,
				actual: v.actual,
				message: v.message,
				severity: v.severity,
			})),
			diff: {
				hasBreaking: diffResult.hasBreaking,
				entries: diffResult.entries.map((e) => ({
					type: e.type,
					path: e.path,
					breaking: e.breaking,
					category: e.category,
				})),
			},
		};
	});

export const runValidation = createServerFn({ method: "POST" })
	.validator(
		(input: {
			specId: string;
			endpointId: string;
			organizationId: string;
			url: string;
			method: string;
			headers?: Record<string, string>;
			body?: unknown;
			save: boolean;
		}) => input,
	)
	.handler(async ({ data }) => {
		const reqHeaders = getRequestHeaders();
		const session = await auth.api.getSession({ headers: reqHeaders });
		if (!session) throw new Error("Unauthorized");

		const start = Date.now();
		const fetchRes = await fetch(data.url, {
			method: data.method,
			headers: {
				"Content-Type": "application/json",
				...data.headers,
			},
			body: data.body ? JSON.stringify(data.body) : undefined,
		});
		const latencyMs = Date.now() - start;

		const responseHeaders: Record<string, string> = {};
		fetchRes.headers.forEach((value, key) => {
			responseHeaders[key] = value;
		});

		const responseBody = await fetchRes.json().catch(() => null);

		const ep = await db
			.select()
			.from(endpoint)
			.where(eq(endpoint.id, data.endpointId))
			.then((r) => r[0] ?? null);

		if (!ep) throw new Error("Endpoint not found");

		const schema = extractSchema(
			ep.responses as Record<string, unknown> | null,
			String(fetchRes.status),
		);

		let validationOutcome: "pass" | "warning" | "fail" = "warning";
		let violations: Array<Record<string, string | undefined>> = [];

		if (schema) {
			const result = validateResponseAgainstSchema(schema, responseBody);
			validationOutcome = result.outcome;
			violations = result.violations.map((v) => ({
				type: v.type,
				path: v.path,
				expected: v.expected,
				actual: v.actual,
				message: v.message,
				severity: v.severity,
			}));
		}

		const diffEntries: Array<
			Record<string, string | number | boolean | null | undefined>
		> = [];

		if (schema) {
			const diffResult = computeDiff(responseBody, schema, schema);
			for (const e of diffResult.entries) {
				diffEntries.push({
					type: e.type,
					path: e.path,
					breaking: e.breaking,
					category: e.category,
				});
			}
		}

		let runId: string | null = null;

		if (data.save) {
			runId = crypto.randomUUID();
			const resultId = crypto.randomUUID();

			const ipVal = reqHeaders.get("x-forwarded-for") ?? undefined;
			await writeAuditLog({
				workspaceId: data.organizationId,
				actorId: session.user.id,
				action: "validation.run_completed",
				entityType: "validation_run",
				entityId: runId,
				metadata: {
					endpointId: data.endpointId,
					outcome: validationOutcome,
					statusCode: fetchRes.status,
				},
				ipAddress: ipVal,
			});

			await db.insert(validationRun).values({
				id: runId,
				workspaceId: data.organizationId,
				specificationId: data.specId,
				triggerType: "manual",
				status: "completed",
				totalChecks: 1,
				passedChecks: validationOutcome === "pass" ? 1 : 0,
				warningChecks: validationOutcome === "warning" ? 1 : 0,
				failedChecks: validationOutcome === "fail" ? 1 : 0,
				startedAt: new Date(),
				completedAt: new Date(),
				createdBy: session.user.id,
			});

			await db.insert(validationResult).values({
				id: resultId,
				runId,
				endpointId: data.endpointId,
				workspaceId: data.organizationId,
				requestSnapshot: {
					method: data.method,
					url: data.url,
					headers: data.headers,
					body: data.body,
				},
				responseStatusCode: fetchRes.status,
				responseHeaders: responseHeaders,
				responseBody,
				expectedSchema: schema,
				outcome: validationOutcome,
				violations,
				diff: diffEntries,
				latencyMs,
			});
		}

		return {
			runId,
			response: {
				statusCode: fetchRes.status,
				headers: responseHeaders,
				body: responseBody,
				latencyMs,
			},
			validation: {
				outcome: validationOutcome,
				violations,
				diff: {
					entries: diffEntries,
					hasBreaking: diffEntries.some((e) => e.breaking === true),
				},
			},
		};
	});

export const getValidationRuns = createServerFn({ method: "GET" })
	.validator(
		(input: {
			organizationId: string;
			specId?: string;
			status?: string;
			triggerType?: string;
			dateFrom?: string;
			dateTo?: string;
		}) => input,
	)
	.handler(async ({ data }) => {
		const headers = getRequestHeaders();
		const session = await auth.api.getSession({ headers });
		if (!session) throw new Error("Unauthorized");

		const conditions = [eq(validationRun.workspaceId, data.organizationId)];

		if (data.specId) {
			conditions.push(eq(validationRun.specificationId, data.specId));
		}
		if (data.status) {
			conditions.push(eq(validationRun.status, data.status));
		}
		if (data.triggerType) {
			conditions.push(eq(validationRun.triggerType, data.triggerType));
		}
		if (data.dateFrom) {
			conditions.push(gte(validationRun.createdAt, new Date(data.dateFrom)));
		}
		if (data.dateTo) {
			conditions.push(lte(validationRun.createdAt, new Date(data.dateTo)));
		}

		const runs = await db
			.select()
			.from(validationRun)
			.where(and(...conditions))
			.orderBy(desc(validationRun.createdAt))
			.limit(50);

		const total = await db
			.select({ count: count() })
			.from(validationRun)
			.where(and(...conditions))
			.then((r) => r[0]?.count ?? 0);

		return { runs, total };
	});

export const getValidationRun = createServerFn({ method: "GET", strict: false })
	.validator((input: { runId: string }) => input)
	.handler(async ({ data }) => {
		const headers = getRequestHeaders();
		const session = await auth.api.getSession({ headers });
		if (!session) throw new Error("Unauthorized");

		const run = await db
			.select()
			.from(validationRun)
			.where(eq(validationRun.id, data.runId))
			.then((r) => r[0] ?? null);

		if (!run) throw new Error("Validation run not found");

		const results = await db
			.select()
			.from(validationResult)
			.where(eq(validationResult.runId, data.runId))
			.orderBy(validationResult.createdAt);

		const spec = run.specificationId
			? await db
					.select({ name: specification.name })
					.from(specification)
					.where(eq(specification.id, run.specificationId))
					.then((r) => r[0] ?? null)
			: null;

		return {
			...run,
			results,
			specName: spec?.name ?? null,
		};
	});

export const getEndpointValidationHistory = createServerFn({
	method: "GET",
	strict: false,
})
	.validator((input: { endpointId: string }) => input)
	.handler(async ({ data }) => {
		const headers = getRequestHeaders();
		const session = await auth.api.getSession({ headers });
		if (!session) throw new Error("Unauthorized");

		const results = await db
			.select({
				id: validationResult.id,
				runId: validationResult.runId,
				endpointId: validationResult.endpointId,
				responseStatusCode: validationResult.responseStatusCode,
				latencyMs: validationResult.latencyMs,
				outcome: validationResult.outcome,
				violations: validationResult.violations,
				diff: validationResult.diff,
				responseBody: validationResult.responseBody,
				requestSnapshot: validationResult.requestSnapshot,
				createdAt: validationResult.createdAt,
			})
			.from(validationResult)
			.where(eq(validationResult.endpointId, data.endpointId))
			.orderBy(desc(validationResult.createdAt))
			.limit(25);

		return results;
	});
