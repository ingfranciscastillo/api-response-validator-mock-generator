import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq, ilike } from "drizzle-orm";
import yaml from "js-yaml";
import {
	buildStorageKey,
	deleteFromR2,
	downloadFromR2,
	isR2Configured,
	uploadToR2,
} from "#/lib/storage";
import { db } from "@/db";
import { endpoint, specification, specificationVersion } from "@/db/schema";
import { writeAuditLog } from "@/lib/audit/functions";
import { requireOrg } from "@/lib/auth/org";
import { compareSpecificationVersions } from "./compare";
import { buildSummary, parseSpec, parseSpecFromUrl } from "./parser";

function parseRawDocument(specContent: string): Record<string, unknown> {
	const trimmed = specContent.trim();
	if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
		return JSON.parse(trimmed);
	}
	return yaml.load(trimmed) as Record<string, unknown>;
}

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

		// El documento "crudo" real es el spec original, no `parsed`
		const rawDocument: Record<string, unknown> | null = data.specContent
			? parseRawDocument(data.specContent)
			: null; // si vino por URL, decide si lo quieres fetch+guardar también

		const rawStr = JSON.stringify(rawDocument ?? parsed);
		let storageKey: string | null = null;
		let finalRawDocument: Record<string, unknown> | null = rawDocument;

		if (isR2Configured() && Buffer.byteLength(rawStr) > 200 * 1024) {
			const key = buildStorageKey(orgId, "specs", specId, "v1/document.json");
			await uploadToR2(key, rawStr, "application/json");
			storageKey = key;
			finalRawDocument = null;
		}

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
			openapiSpec: finalRawDocument,
			storageKey,
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
					serverUrl: parsed.serverUrl,
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

export const reimportSpec = createServerFn({ method: "POST" })
	.validator(
		(input: { specId: string; specContent?: string; specUrl?: string }) =>
			input,
	)
	.handler(async ({ data }) => {
		const { orgId, userId, ipAddress } = await requireOrg();

		const spec = await db
			.select()
			.from(specification)
			.where(eq(specification.id, data.specId))
			.then((r) => r[0] ?? null);

		if (!spec) throw new Error("Spec not found");

		const lastVersion = await db
			.select()
			.from(specificationVersion)
			.where(eq(specificationVersion.specId, data.specId))
			.orderBy(desc(specificationVersion.version))
			.then((r) => r[0]);

		const newVersionNumber = lastVersion ? lastVersion.version + 1 : 1;

		const parsed = data.specUrl
			? await parseSpecFromUrl(data.specUrl)
			: await parseSpec(data.specContent!);

		const versionId = crypto.randomUUID();
		const summary = buildSummary(parsed.endpoints, parsed.tags);

		// El documento "crudo" real es el spec original (lo que el usuario pegó/editó),
		// no `parsed` (que ya es la forma transformada ParsedSpec).
		const rawDocument: Record<string, unknown> | null = data.specContent
			? parseRawDocument(data.specContent)
			: null;

		const rawStr = JSON.stringify(rawDocument ?? parsed);
		let storageKey: string | null = null;
		let finalRawDocument: Record<string, unknown> | null = rawDocument;

		if (isR2Configured() && Buffer.byteLength(rawStr) > 200 * 1024) {
			const key = buildStorageKey(
				orgId,
				"specs",
				data.specId,
				`v${newVersionNumber}/document.json`,
			);
			await uploadToR2(key, rawStr, "application/json");
			storageKey = key;
			finalRawDocument = null;
		}

		await db.insert(specificationVersion).values({
			id: versionId,
			specId: data.specId,
			version: newVersionNumber,
			openapiSpec: finalRawDocument,
			storageKey,
			summary,
		});

		if (parsed.endpoints.length > 0) {
			await db.insert(endpoint).values(
				parsed.endpoints.map((ep) => ({
					id: crypto.randomUUID(),
					specId: data.specId,
					specVersionId: versionId,
					method: ep.method,
					path: ep.path,
					summary: ep.summary,
					operationId: ep.operationId,
					parameters: ep.parameters as Record<string, unknown> | null,
					requestBody: ep.requestBody as Record<string, unknown> | null,
					responses: ep.responses as Record<string, unknown>,
					serverUrl: parsed.serverUrl,
				})),
			);
		}

		await db
			.update(specification)
			.set({ updatedAt: new Date() })
			.where(eq(specification.id, data.specId));

		await writeAuditLog({
			workspaceId: orgId,
			actorId: userId,
			action: "spec.reimported",
			entityType: "specification",
			entityId: data.specId,
			metadata: {
				version: newVersionNumber,
				endpointCount: parsed.endpoints.length,
			},
			ipAddress,
		});

		return {
			specId: data.specId,
			versionId,
			endpointCount: parsed.endpoints.length,
		};
	});

export const getSpecContent = createServerFn({ method: "GET", strict: false })
	.validator((input: { versionId: string }) => input)
	.handler(async ({ data }) => {
		await requireOrg();

		const version = await db
			.select()
			.from(specificationVersion)
			.where(eq(specificationVersion.id, data.versionId))
			.then((r) => r[0] ?? null);

		if (!version) throw new Error("Version not found");

		if (version.openapiSpec)
			return version.openapiSpec as Record<string, unknown>;
		if (version.storageKey && isR2Configured()) {
			const buf = await downloadFromR2(version.storageKey);
			return JSON.parse(buf.toString()) as Record<string, unknown>;
		}

		return null;
	});

export const getSpecs = createServerFn({ method: "GET", strict: false })
	.validator((input: { search?: string }) => input)
	.handler(async ({ data }) => {
		const { orgId } = await requireOrg();

		const filters = [eq(specification.organizationId, orgId)];
		if (data.search) {
			filters.push(ilike(specification.name, `%${data.search}%`));
		}

		const specs = await db
			.select()
			.from(specification)
			.where(and(...filters))
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

export const deleteSpec = createServerFn({ method: "POST" })
	.validator((input: { specId: string }) => input)
	.handler(async ({ data }) => {
		const { orgId, userId, ipAddress } = await requireOrg();

		const spec = await db
			.select()
			.from(specification)
			.where(
				and(
					eq(specification.id, data.specId),
					eq(specification.organizationId, orgId),
				),
			)
			.then((r) => r[0] ?? null);

		if (!spec) throw new Error("Spec not found");

		if (isR2Configured()) {
			const versions = await db
				.select()
				.from(specificationVersion)
				.where(eq(specificationVersion.specId, data.specId));

			for (const version of versions) {
				if (version.storageKey) {
					await deleteFromR2(version.storageKey).catch(() => {});
				}
			}
		}

		await db.delete(specification).where(eq(specification.id, data.specId));

		await writeAuditLog({
			workspaceId: orgId,
			actorId: userId,
			action: "spec.deleted",
			entityType: "specification",
			entityId: data.specId,
			metadata: { name: spec.name },
			ipAddress,
		});

		return { success: true };
	});

export const compareVersions = createServerFn({ method: "GET", strict: false })
	.validator((input: { fromVersionId: string; toVersionId: string }) => input)
	.handler(async ({ data }) => {
		return compareSpecificationVersions(data.fromVersionId, data.toVersionId);
	});
