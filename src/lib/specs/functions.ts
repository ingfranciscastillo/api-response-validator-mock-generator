import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { endpoint, specification, specificationVersion } from "@/db/schema";
import { auth } from "@/lib/auth";
import { buildSummary, parseSpec, parseSpecFromUrl } from "./parser";

export const importSpec = createServerFn({ method: "POST" })
	.validator(
		(input: {
			name: string;
			description?: string;
			organizationId: string;
			specContent?: string;
			specUrl?: string;
		}) => input,
	)
	.handler(async ({ data }) => {
		const headers = getRequestHeaders();
		const session = await auth.api.getSession({ headers });
		if (!session) throw new Error("Unauthorized");

		const parsed = data.specUrl
			? await parseSpecFromUrl(data.specUrl)
			: await parseSpec(data.specContent!);

		const specId = crypto.randomUUID();
		const versionId = crypto.randomUUID();

		const summary = buildSummary(parsed.endpoints);

		await db.insert(specification).values({
			id: specId,
			name: data.name,
			description: data.description ?? null,
			organizationId: data.organizationId,
		});

		await db.insert(specificationVersion).values({
			id: versionId,
			specId,
			version: 1,
			openapiSpec: parsed as unknown as Record<string, unknown>,
			summary: { ...summary, tags: parsed.tags },
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

		return { specId, versionId, endpointCount: parsed.endpoints.length };
	});

export const getSpecs = createServerFn({ method: "GET" })
	.validator((input: { organizationId: string }) => input)
	.handler(async ({ data }) => {
		const headers = getRequestHeaders();
		const session = await auth.api.getSession({ headers });
		if (!session) throw new Error("Unauthorized");

		const specs = await db
			.select()
			.from(specification)
			.where(eq(specification.organizationId, data.organizationId))
			.orderBy(desc(specification.updatedAt));

		return specs;
	});

export const getSpec = createServerFn({ method: "GET", strict: false })
	.validator((input: { specId: string }) => input)
	.handler(async ({ data }) => {
		const headers = getRequestHeaders();
		const session = await auth.api.getSession({ headers });
		if (!session) throw new Error("Unauthorized");

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
		const headers = getRequestHeaders();
		const session = await auth.api.getSession({ headers });
		if (!session) throw new Error("Unauthorized");

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
		const headers = getRequestHeaders();
		const session = await auth.api.getSession({ headers });
		if (!session) throw new Error("Unauthorized");

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
		const headers = getRequestHeaders();
		const session = await auth.api.getSession({ headers });
		if (!session) throw new Error("Unauthorized");

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
