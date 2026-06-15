import { createServerFn } from "@tanstack/react-start";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { endpoint, specification, specificationVersion } from "@/db/schema";
import { writeAuditLog } from "@/lib/audit/functions";
import { requireOrg } from "@/lib/auth/org";
import { buildSummary, parseSpec, parseSpecFromUrl } from "./parser";

export const importSpec = createServerFn({ method: "POST" })
	.validator(
		(input: {
			name: string;
			description?: string;
			specContent?: string;
			specUrl?: string;
		}) => input,
	)
	.handler(async ({ data }) => {
		const { orgId, userId, ipAddress } = await requireOrg();

		const parsed = data.specUrl
			? await parseSpecFromUrl(data.specUrl)
			: await parseSpec(data.specContent!);

		const specId = crypto.randomUUID();
		const versionId = crypto.randomUUID();

		const summary = buildSummary(parsed.endpoints, parsed.tags);

		await db.insert(specification).values({
			id: specId,
			name: data.name,
			description: data.description ?? null,
			organizationId: orgId,
		});

		await db.insert(specificationVersion).values({
			id: versionId,
			specId,
			version: 1,
			openapiSpec: parsed as unknown as Record<string, unknown>,
			summary,
		});

		if (parsed.endpoints.length > 0) {
			await db.insert(endpoint).values(
				parsed.endpoints.map((ep) => ({
					id: crypto.randomUUID(),
					specId,
					specVersionId: versionId,
					method: ep.method,
					path: ep.path,
					summary: ep.summary,
					operationId: ep.operationId,
					parameters: ep.parameters as Record<string, unknown> | null,
					requestBody: ep.requestBody as Record<string, unknown> | null,
					responses: ep.responses as Record<string, unknown>,
				})),
			);
		}

		await writeAuditLog({
			workspaceId: orgId,
			actorId: userId,
			action: "spec.imported",
			entityType: "specification",
			entityId: specId,
			metadata: {
				name: data.name,
				version: 1,
				endpointCount: parsed.endpoints.length,
			},
			ipAddress,
		});

		return { specId, versionId, endpointCount: parsed.endpoints.length };
	});

export const getSpecs = createServerFn({ method: "GET" }).handler(async () => {
	const { orgId } = await requireOrg();

	const specs = await db
		.select()
		.from(specification)
		.where(eq(specification.organizationId, orgId))
		.orderBy(desc(specification.updatedAt));

	return specs;
});

export const getSpec = createServerFn({ method: "GET", strict: false })
	.validator((input: { specId: string }) => input)
	.handler(async ({ data }) => {
		await requireOrg();

		const spec = await db
			.select()
			.from(specification)
			.where(eq(specification.id, data.specId))
			.then((r) => r[0] ?? null);

		if (!spec) throw new Error("Spec not found");

		const versions = await db
			.select()
			.from(specificationVersion)
			.where(eq(specificationVersion.specId, data.specId))
			.orderBy(desc(specificationVersion.version));

		return { ...spec, versions };
	});

export const getEndpoint = createServerFn({ method: "GET", strict: false })
	.validator((input: { endpointId: string }) => input)
	.handler(async ({ data }) => {
		await requireOrg();

		const ep = await db
			.select()
			.from(endpoint)
			.where(eq(endpoint.id, data.endpointId))
			.then((r) => r[0] ?? null);

		if (!ep) throw new Error("Endpoint not found");

		return ep;
	});

export const getEndpoints = createServerFn({ method: "GET", strict: false })
	.validator((input: { specVersionId: string }) => input)
	.handler(async ({ data }) => {
		await requireOrg();

		const endpoints_ = await db
			.select()
			.from(endpoint)
			.where(eq(endpoint.specVersionId, data.specVersionId))
			.orderBy(endpoint.path, endpoint.method);

		return endpoints_;
	});

export const getSpecVersions = createServerFn({ method: "GET" })
	.validator((input: { specId: string }) => input)
	.handler(async ({ data }) => {
		await requireOrg();

		return db
			.select({
				id: specificationVersion.id,
				version: specificationVersion.version,
				createdAt: specificationVersion.createdAt,
			})
			.from(specificationVersion)
			.where(eq(specificationVersion.specId, data.specId))
			.orderBy(desc(specificationVersion.version));
	});
