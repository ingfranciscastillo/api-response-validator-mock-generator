import { createServerFn } from "@tanstack/react-start";
import { and, count, desc, eq, like, sql } from "drizzle-orm";
import { db } from "@/db";
import { endpoint, mockDataset, mockServeConfig } from "@/db/schema";
import { writeAuditLog } from "@/lib/audit/functions";
import { requireOrg } from "@/lib/auth/org";
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
			const { orgId, userId, ipAddress } = await requireOrg();

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
					workspaceId: orgId,
					specificationId: data.specId,
					endpointId: data.endpointId,
					name: `${ep.method} ${ep.path} — ${data.variantType}`,
					statusCode: data.statusCode,
					variantType: data.variantType,
					variantLabel: data.variantLabel ?? null,
					payload,
					generationRules: data.rules ?? null,
					seed: data.seed ? String(data.seed) : null,
					createdBy: userId,
				});
			}

			if (data.save && mockId) {
				await writeAuditLog({
					workspaceId: orgId,
					actorId: userId,
					action: "mock.generated",
					entityType: "mock_dataset",
					entityId: mockId,
					metadata: {
						endpointId: data.endpointId,
						variantType: data.variantType,
						statusCode: data.statusCode,
					},
					ipAddress,
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
		}) => input,
	)
	.handler(
		async ({
			data,
		}): Promise<{
			mockIds: string[];
			payloads: JsonValue[];
		}> => {
			const { orgId, userId, ipAddress } = await requireOrg();

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
						workspaceId: orgId,
						specificationId: data.specId,
						endpointId: data.endpointId,
						name: `${ep.method} ${ep.path} — variant ${i + 1}`,
						statusCode: data.statusCode,
						variantType: "generated",
						payload: payloads[i],
						generationRules: data.rules ?? null,
						seed: data.seed ? String(Number(data.seed) + i) : null,
						createdBy: userId,
					});
				}
			}

			if (data.save && mockIds.length > 0) {
				await writeAuditLog({
					workspaceId: orgId,
					actorId: userId,
					action: "mock.batch_generated",
					entityType: "mock_dataset",
					entityId: mockIds[0],
					metadata: {
						count: mockIds.length,
						mockIds,
						endpointId: data.endpointId,
						statusCode: data.statusCode,
					},
					ipAddress,
				});
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
			const { orgId, userId, ipAddress } = await requireOrg();

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
						workspaceId: orgId,
						specificationId: data.specId,
						endpointId: data.endpointId,
						name: `${ep.method} ${ep.path} — edge case`,
						statusCode: data.statusCode,
						variantType: "edge_case",
						variantLabel: labels[i],
						payload: payloads[i],
						createdBy: userId,
					});
				}
			}

			if (data.save && mockIds.length > 0) {
				await writeAuditLog({
					workspaceId: orgId,
					actorId: userId,
					action: "mock.edge_cases_generated",
					entityType: "mock_dataset",
					entityId: mockIds[0],
					metadata: {
						count: mockIds.length,
						mockIds,
						endpointId: data.endpointId,
						statusCode: data.statusCode,
					},
					ipAddress,
				});
			}

			return { mockIds, payloads, labels };
		},
	);

export const saveMock = createServerFn({ method: "POST" })
	.validator(
		(input: {
			specId: string;
			endpointId: string;
			statusCode: number;
			variantType: string;
			variantLabel?: string;
			name: string;
			payload: Record<string, unknown>;
			tags?: string[];
		}) => input,
	)
	.handler(async ({ data }) => {
		const { orgId, userId, ipAddress } = await requireOrg();

		const mockId = crypto.randomUUID();

		await db.insert(mockDataset).values({
			id: mockId,
			workspaceId: orgId,
			specificationId: data.specId,
			endpointId: data.endpointId,
			name: data.name,
			statusCode: data.statusCode,
			variantType: data.variantType,
			variantLabel: data.variantLabel ?? null,
			payload: data.payload,
			tags: data.tags ?? null,
			createdBy: userId,
		});

		await writeAuditLog({
			workspaceId: orgId,
			actorId: userId,
			action: "mock.saved",
			entityType: "mock_dataset",
			entityId: mockId,
			metadata: {
				endpointId: data.endpointId,
				variantType: data.variantType,
				statusCode: data.statusCode,
			},
			ipAddress,
		});

		return { mockId };
	});

export const getMocks = createServerFn({ method: "GET", strict: false })
	.validator(
		(input: {
			specId?: string;
			endpointId?: string;
			variantType?: string;
			search?: string;
			page?: number;
			pageSize?: number;
		}) => input,
	)
	.handler(async ({ data }) => {
		const { orgId } = await requireOrg();

		const conditions = [
			eq(mockDataset.workspaceId, orgId),
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

		const pageSize = data.pageSize ?? 25;
		const page = data.page ?? 1;
		const offset = (page - 1) * pageSize;

		const mocks = await db
			.select()
			.from(mockDataset)
			.where(and(...conditions))
			.orderBy(desc(mockDataset.createdAt))
			.limit(pageSize)
			.offset(offset);

		const total = await db
			.select({ count: count() })
			.from(mockDataset)
			.where(and(...conditions))
			.then((r) => r[0]?.count ?? 0);

		return {
			mocks,
			total,
			page,
			pageSize,
			totalPages: Math.ceil(total / pageSize),
		};
	});

export const getMock = createServerFn({ method: "GET", strict: false })
	.validator((input: { mockId: string }) => input)
	.handler(async ({ data }) => {
		await requireOrg();

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
		await requireOrg();

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
		const { userId, ipAddress } = await requireOrg();

		const mock = await db
			.select({ workspaceId: mockDataset.workspaceId })
			.from(mockDataset)
			.where(eq(mockDataset.id, data.mockId))
			.then((r) => r[0] ?? null);

		if (!mock) throw new Error("Mock not found");

		await db
			.update(mockDataset)
			.set({ deletedAt: new Date() })
			.where(eq(mockDataset.id, data.mockId));

		await writeAuditLog({
			workspaceId: mock.workspaceId,
			actorId: userId,
			action: "mock.deleted",
			entityType: "mock_dataset",
			entityId: data.mockId,
			ipAddress,
		});

		return { success: true };
	});

export const toggleMockServing = createServerFn({ method: "POST" })
	.validator((input: { mockId: string; isEnabled: boolean }) => input)
	.handler(async ({ data }) => {
		const { orgId, userId, ipAddress } = await requireOrg();

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
				workspaceId: orgId,
				mockDatasetId: data.mockId,
				isEnabled: data.isEnabled,
			});
		}

		await writeAuditLog({
			workspaceId: orgId,
			actorId: userId,
			action: data.isEnabled ? "mock.serving_started" : "mock.serving_stopped",
			entityType: "mock_serve_config",
			entityId: data.mockId,
			metadata: { isEnabled: data.isEnabled },
			ipAddress,
		});

		return { success: true };
	});

export const updateServingConfig = createServerFn({ method: "POST" })
	.validator(
		(input: {
			mockId: string;
			latencyMs: number;
			responseHeadersOverride?: Record<string, string> | null;
		}) => input,
	)
	.handler(async ({ data }) => {
		const { orgId } = await requireOrg();

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
				workspaceId: orgId,
				mockDatasetId: data.mockId,
				isEnabled: true,
				latencyMs: data.latencyMs,
				responseHeadersOverride: data.responseHeadersOverride ?? null,
			});
		}

		return { success: true };
	});
