import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { and, desc, eq, like, sql } from "drizzle-orm";
import { db } from "@/db";
import { endpoint, mockDataset, mockServeConfig } from "@/db/schema";
import { auth } from "@/lib/auth";
import {
	type GenerationRules,
	generateEdgeCaseMocks,
	generateMock,
	generateMockVariants,
	type JsonValue,
} from "./engine";

export const generateEndpointMock = createServerFn({ method: "POST" })
	.validator(
		(input: {
			specId: string;
			endpointId: string;
			statusCode: number;
			variantType: string;
			variantLabel?: string;
			rules?: GenerationRules | null;
			seed?: number | string | null;
			save: boolean;
			organizationId: string;
		}) => input,
	)
	.handler(
		async ({
			data,
		}): Promise<{
			mockId: string | null;
			payload: JsonValue;
			schema: JsonValue;
		}> => {
			const headers = getRequestHeaders();
			const session = await auth.api.getSession({ headers });
			if (!session) throw new Error("Unauthorized");

			const ep = await db
				.select()
				.from(endpoint)
				.where(eq(endpoint.id, data.endpointId))
				.then((r) => r[0] ?? null);

			if (!ep) throw new Error("Endpoint not found");

			const responses = ep.responses as Record<string, unknown> | null;
			const responseSchema = responses?.[String(data.statusCode)] as
				| Record<string, unknown>
				| undefined;
			const content = responseSchema?.content as
				| Record<string, unknown>
				| undefined;
			const jsonContent = content?.["application/json"] as
				| Record<string, unknown>
				| undefined;
			const schema = jsonContent?.schema as Record<string, unknown> | undefined;

			if (!schema) {
				throw new Error(`No schema found for status code ${data.statusCode}`);
			}

			const payload = await generateMock(schema, data.rules, data.seed);

			let mockId: string | null = null;

			if (data.save) {
				mockId = crypto.randomUUID();

				await db.insert(mockDataset).values({
					id: mockId,
					workspaceId: data.organizationId,
					specificationId: data.specId,
					endpointId: data.endpointId,
					name: `${ep.method} ${ep.path} — ${data.variantType}`,
					statusCode: data.statusCode,
					variantType: data.variantType,
					variantLabel: data.variantLabel ?? null,
					payload,
					generationRules: data.rules ?? null,
					seed: data.seed ? String(data.seed) : null,
					createdBy: session.user.id,
				});
			}

			return { mockId, payload, schema: schema as JsonValue };
		},
	);

export const generateMocksVariant = createServerFn({ method: "POST" })
	.validator(
		(input: {
			specId: string;
			endpointId: string;
			statusCode: number;
			count: number;
			rules?: GenerationRules | null;
			seed?: number | string | null;
			save: boolean;
			organizationId: string;
		}) => input,
	)
	.handler(
		async ({
			data,
		}): Promise<{
			mockIds: string[];
			payloads: JsonValue[];
		}> => {
			const headers = getRequestHeaders();
			const session = await auth.api.getSession({ headers });
			if (!session) throw new Error("Unauthorized");

			const ep = await db
				.select()
				.from(endpoint)
				.where(eq(endpoint.id, data.endpointId))
				.then((r) => r[0] ?? null);

			if (!ep) throw new Error("Endpoint not found");

			const responses = ep.responses as Record<string, unknown> | null;
			const responseSchema = responses?.[String(data.statusCode)] as
				| Record<string, unknown>
				| undefined;
			const content = responseSchema?.content as
				| Record<string, unknown>
				| undefined;
			const jsonContent = content?.["application/json"] as
				| Record<string, unknown>
				| undefined;
			const schema = jsonContent?.schema as Record<string, unknown> | undefined;

			if (!schema) {
				throw new Error(`No schema found for status code ${data.statusCode}`);
			}

			const payloads = await generateMockVariants(
				schema,
				data.count,
				data.rules,
				data.seed,
			);

			const mockIds: string[] = [];

			if (data.save) {
				for (let i = 0; i < payloads.length; i++) {
					const mockId = crypto.randomUUID();
					mockIds.push(mockId);

					await db.insert(mockDataset).values({
						id: mockId,
						workspaceId: data.organizationId,
						specificationId: data.specId,
						endpointId: data.endpointId,
						name: `${ep.method} ${ep.path} — variant ${i + 1}`,
						statusCode: data.statusCode,
						variantType: "generated",
						payload: payloads[i],
						generationRules: data.rules ?? null,
						seed: data.seed ? String(Number(data.seed) + i) : null,
						createdBy: session.user.id,
					});
				}
			}

			return { mockIds, payloads };
		},
	);

export const generateEdgeCaseMocksFn = createServerFn({ method: "POST" })
	.validator(
		(input: {
			specId: string;
			endpointId: string;
			statusCode: number;
			save: boolean;
			organizationId: string;
		}) => input,
	)
	.handler(
		async ({
			data,
		}): Promise<{
			mockIds: string[];
			payloads: JsonValue[];
			labels: string[];
		}> => {
			const headers = getRequestHeaders();
			const session = await auth.api.getSession({ headers });
			if (!session) throw new Error("Unauthorized");

			const ep = await db
				.select()
				.from(endpoint)
				.where(eq(endpoint.id, data.endpointId))
				.then((r) => r[0] ?? null);

			if (!ep) throw new Error("Endpoint not found");

			const responses = ep.responses as Record<string, unknown> | null;
			const responseSchema = responses?.[String(data.statusCode)] as
				| Record<string, unknown>
				| undefined;
			const content = responseSchema?.content as
				| Record<string, unknown>
				| undefined;
			const jsonContent = content?.["application/json"] as
				| Record<string, unknown>
				| undefined;
			const schema = jsonContent?.schema as Record<string, unknown> | undefined;

			if (!schema) {
				throw new Error(`No schema found for status code ${data.statusCode}`);
			}

			const payloads = await generateEdgeCaseMocks(schema);
			const labels = ["Empty", "Nulls", "Boundary"];
			const mockIds: string[] = [];

			if (data.save) {
				for (let i = 0; i < payloads.length; i++) {
					const mockId = crypto.randomUUID();
					mockIds.push(mockId);

					await db.insert(mockDataset).values({
						id: mockId,
						workspaceId: data.organizationId,
						specificationId: data.specId,
						endpointId: data.endpointId,
						name: `${ep.method} ${ep.path} — edge case`,
						statusCode: data.statusCode,
						variantType: "edge_case",
						variantLabel: labels[i],
						payload: payloads[i],
						createdBy: session.user.id,
					});
				}
			}

			return { mockIds, payloads, labels };
		},
	);

export const saveMock = createServerFn({ method: "POST" })
	.validator(
		(input: {
			specId: string;
			endpointId: string;
			organizationId: string;
			statusCode: number;
			variantType: string;
			variantLabel?: string;
			name: string;
			payload: Record<string, unknown>;
			tags?: string[];
		}) => input,
	)
	.handler(async ({ data }) => {
		const headers = getRequestHeaders();
		const session = await auth.api.getSession({ headers });
		if (!session) throw new Error("Unauthorized");

		const mockId = crypto.randomUUID();

		await db.insert(mockDataset).values({
			id: mockId,
			workspaceId: data.organizationId,
			specificationId: data.specId,
			endpointId: data.endpointId,
			name: data.name,
			statusCode: data.statusCode,
			variantType: data.variantType,
			variantLabel: data.variantLabel ?? null,
			payload: data.payload,
			tags: data.tags ?? null,
			createdBy: session.user.id,
		});

		return { mockId };
	});

export const getMocks = createServerFn({ method: "GET", strict: false })
	.validator(
		(input: {
			organizationId: string;
			specId?: string;
			endpointId?: string;
			variantType?: string;
			search?: string;
		}) => input,
	)
	.handler(async ({ data }) => {
		const headers = getRequestHeaders();
		const session = await auth.api.getSession({ headers });
		if (!session) throw new Error("Unauthorized");

		const conditions = [
			eq(mockDataset.workspaceId, data.organizationId),
			sql`${mockDataset.deletedAt} IS NULL`,
		];

		if (data.specId) {
			conditions.push(eq(mockDataset.specificationId, data.specId));
		}
		if (data.endpointId) {
			conditions.push(eq(mockDataset.endpointId, data.endpointId));
		}
		if (data.variantType) {
			conditions.push(eq(mockDataset.variantType, data.variantType));
		}
		if (data.search) {
			conditions.push(like(mockDataset.name, `%${data.search}%`));
		}

		const mocks = await db
			.select()
			.from(mockDataset)
			.where(and(...conditions))
			.orderBy(desc(mockDataset.createdAt))
			.limit(50);

		return mocks;
	});

export const getMock = createServerFn({ method: "GET", strict: false })
	.validator((input: { mockId: string }) => input)
	.handler(async ({ data }) => {
		const headers = getRequestHeaders();
		const session = await auth.api.getSession({ headers });
		if (!session) throw new Error("Unauthorized");

		const mock = await db
			.select()
			.from(mockDataset)
			.where(
				and(
					eq(mockDataset.id, data.mockId),
					sql`${mockDataset.deletedAt} IS NULL`,
				),
			)
			.then((r) => r[0] ?? null);

		if (!mock) throw new Error("Mock not found");

		const servingConfig = await db
			.select()
			.from(mockServeConfig)
			.where(eq(mockServeConfig.mockDatasetId, data.mockId))
			.then((r) => r[0] ?? null);

		return { mock, servingConfig };
	});

export const updateMock = createServerFn({ method: "POST" })
	.validator(
		(input: {
			mockId: string;
			name?: string;
			variantLabel?: string;
			tags?: string[];
			isPinned?: boolean;
			payload?: Record<string, unknown>;
		}) => input,
	)
	.handler(async ({ data }) => {
		const headers = getRequestHeaders();
		const session = await auth.api.getSession({ headers });
		if (!session) throw new Error("Unauthorized");

		const updates: Record<string, unknown> = {};
		if (data.name !== undefined) updates.name = data.name;
		if (data.variantLabel !== undefined)
			updates.variantLabel = data.variantLabel;
		if (data.tags !== undefined) updates.tags = data.tags;
		if (data.isPinned !== undefined) updates.isPinned = data.isPinned;
		if (data.payload !== undefined) updates.payload = data.payload;

		await db
			.update(mockDataset)
			.set(updates as Record<string, unknown>)
			.where(eq(mockDataset.id, data.mockId));

		return { success: true };
	});

export const deleteMock = createServerFn({ method: "POST" })
	.validator((input: { mockId: string }) => input)
	.handler(async ({ data }) => {
		const headers = getRequestHeaders();
		const session = await auth.api.getSession({ headers });
		if (!session) throw new Error("Unauthorized");

		await db
			.update(mockDataset)
			.set({ deletedAt: new Date() })
			.where(eq(mockDataset.id, data.mockId));

		return { success: true };
	});

export const toggleMockServing = createServerFn({ method: "POST" })
	.validator(
		(input: { mockId: string; organizationId: string; isEnabled: boolean }) =>
			input,
	)
	.handler(async ({ data }) => {
		const headers = getRequestHeaders();
		const session = await auth.api.getSession({ headers });
		if (!session) throw new Error("Unauthorized");

		const existing = await db
			.select()
			.from(mockServeConfig)
			.where(eq(mockServeConfig.mockDatasetId, data.mockId))
			.then((r) => r[0] ?? null);

		if (existing) {
			await db
				.update(mockServeConfig)
				.set({ isEnabled: data.isEnabled })
				.where(eq(mockServeConfig.mockDatasetId, data.mockId));
		} else {
			await db.insert(mockServeConfig).values({
				id: crypto.randomUUID(),
				workspaceId: data.organizationId,
				mockDatasetId: data.mockId,
				isEnabled: data.isEnabled,
			});
		}

		return { success: true };
	});

export const updateServingConfig = createServerFn({ method: "POST" })
	.validator(
		(input: {
			mockId: string;
			organizationId: string;
			latencyMs: number;
			responseHeadersOverride?: Record<string, string> | null;
		}) => input,
	)
	.handler(async ({ data }) => {
		const headers = getRequestHeaders();
		const session = await auth.api.getSession({ headers });
		if (!session) throw new Error("Unauthorized");

		const existing = await db
			.select()
			.from(mockServeConfig)
			.where(eq(mockServeConfig.mockDatasetId, data.mockId))
			.then((r) => r[0] ?? null);

		if (existing) {
			await db
				.update(mockServeConfig)
				.set({
					latencyMs: data.latencyMs,
					responseHeadersOverride: data.responseHeadersOverride ?? null,
				})
				.where(eq(mockServeConfig.mockDatasetId, data.mockId));
		} else {
			await db.insert(mockServeConfig).values({
				id: crypto.randomUUID(),
				workspaceId: data.organizationId,
				mockDatasetId: data.mockId,
				isEnabled: true,
				latencyMs: data.latencyMs,
				responseHeadersOverride: data.responseHeadersOverride ?? null,
			});
		}

		return { success: true };
	});
