import SwaggerParser from "@apidevtools/swagger-parser";
import yaml from "js-yaml";

export interface ParsedEndpoint {
	method: string;
	path: string;
	summary: string | null;
	operationId: string | null;
	parameters: unknown;
	requestBody: unknown;
	responses: unknown;
}

export interface ParsedSpec {
	title: string;
	version: string;
	description: string | null;
	endpoints: ParsedEndpoint[];
	webhookEndpoints: ParsedEndpoint[];
	tags: string[];
	serverUrl: string | null;
}

export interface SpecSummary {
	endpointCount: number;
	methods: string[];
	tags: string[];
}

function normalizeMethod(method: string): string {
	return method.toLowerCase();
}

const HTTP_METHODS = [
	"get",
	"post",
	"put",
	"patch",
	"delete",
	"options",
	"head",
	"trace",
];

function extractEndpoints(
	paths: Record<string, Record<string, unknown>> | undefined,
): ParsedEndpoint[] {
	if (!paths) return [];

	const endpoints: ParsedEndpoint[] = [];

	for (const [path, pathItem] of Object.entries(paths)) {
		if (!pathItem || typeof pathItem !== "object") continue;

		for (const [method, operation] of Object.entries(pathItem)) {
			const normalized = normalizeMethod(method);
			if (!HTTP_METHODS.includes(normalized)) continue;
			if (!operation || typeof operation !== "object") continue;

			const op = operation as Record<string, unknown>;
			endpoints.push({
				method: normalized.toUpperCase(),
				path,
				summary: (op.summary as string | null) ?? null,
				operationId: (op.operationId as string | null) ?? null,
				parameters: op.parameters ?? null,
				requestBody: op.requestBody ?? null,
				responses: op.responses ?? null,
			});
		}
	}

	return endpoints;
}

function extractWebhookEndpoints(
	webhooks: Record<string, Record<string, unknown>> | undefined,
): ParsedEndpoint[] {
	if (!webhooks) return [];

	const endpoints: ParsedEndpoint[] = [];

	for (const [webhookName, pathItem] of Object.entries(webhooks)) {
		if (!pathItem || typeof pathItem !== "object") continue;

		for (const [method, operation] of Object.entries(pathItem)) {
			const normalized = normalizeMethod(method);
			if (!HTTP_METHODS.includes(normalized)) continue;
			if (!operation || typeof operation !== "object") continue;

			const op = operation as Record<string, unknown>;
			endpoints.push({
				method: normalized.toUpperCase(),
				path: webhookName,
				summary: (op.summary as string | null) ?? null,
				operationId: (op.operationId as string | null) ?? null,
				parameters: op.parameters ?? null,
				requestBody: op.requestBody ?? null,
				responses: op.responses ?? null,
			});
		}
	}

	return endpoints;
}

function extractTags(
	paths: Record<string, Record<string, unknown>> | undefined,
): string[] {
	if (!paths) return [];
	const tagSet = new Set<string>();

	for (const pathItem of Object.values(paths)) {
		if (!pathItem || typeof pathItem !== "object") continue;
		for (const operation of Object.values(pathItem)) {
			if (!operation || typeof operation !== "object") continue;
			const op = operation as Record<string, unknown>;
			const tags = op.tags as string[] | undefined;
			if (Array.isArray(tags)) {
				for (const tag of tags) tagSet.add(tag);
			}
		}
	}

	return [...tagSet].sort();
}

export function buildSummary(
	endpoints: ParsedEndpoint[],
	tags: string[] = [],
): SpecSummary {
	const methodSet = new Set<string>();
	for (const ep of endpoints) methodSet.add(ep.method);

	const methods = [...methodSet].sort(
		(a, b) => httpMethodOrder(a) - httpMethodOrder(b),
	);

	return {
		endpointCount: endpoints.length,
		methods,
		tags,
	};
}

function httpMethodOrder(method: string): number {
	const order: Record<string, number> = {
		GET: 0,
		POST: 1,
		PUT: 2,
		PATCH: 3,
		DELETE: 4,
		OPTIONS: 5,
		HEAD: 6,
		TRACE: 7,
	};
	return order[method] ?? 99;
}

function tryParseJsonOrYaml(input: string): Record<string, unknown> {
	const trimmed = input.trim();
	if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
		return JSON.parse(trimmed);
	}
	return yaml.load(trimmed) as Record<string, unknown>;
}

function extractServerUrl(spec: Record<string, unknown>): string | null {
	const servers = spec.servers as Array<Record<string, unknown>> | undefined;
	if (servers?.[0]?.url) {
		let url = String(servers[0].url);
		if (url.endsWith("/")) url = url.slice(0, -1);
		return url;
	}

	const scheme = (spec.schemes as string[] | undefined)?.[0] ?? "https";
	const host = spec.host as string | undefined;
	const basePath = (spec.basePath as string | undefined) ?? "";
	if (host) {
		const normalized = basePath.endsWith("/")
			? basePath.slice(0, -1)
			: basePath;
		return `${scheme}://${host}${normalized}`;
	}

	return null;
}

function extractFromDocument(doc: Record<string, unknown>): ParsedSpec {
	const info = doc.info as Record<string, unknown> | undefined;
	const paths = doc.paths as
		| Record<string, Record<string, unknown>>
		| undefined;
	const webhooks = doc.webhooks as
		| Record<string, Record<string, unknown>>
		| undefined;

	return {
		title: (info?.title as string) ?? "Untitled Spec",
		version: (info?.version as string) ?? "1.0.0",
		description: (info?.description as string | null) ?? null,
		endpoints: extractEndpoints(paths),
		webhookEndpoints: extractWebhookEndpoints(webhooks),
		tags: extractTags(paths),
		serverUrl: extractServerUrl(doc),
	};
}

/**
 * Normaliza un spec OpenAPI para evitar errores de validación del parser
 * cuando faltan campos opcionales.
 *
 * - OpenAPI 3.1: `paths` es opcional si existe `webhooks` o `components`
 * - OpenAPI 3.0 / Swagger 2.0: `paths` es requerido pero `{}` es válido
 */
function normalizeSpec(spec: Record<string, unknown>): Record<string, unknown> {
	const version = (spec.openapi as string) ?? (spec.swagger as string);
	const isV31 = typeof version === "string" && version.startsWith("3.1");

	const isOpenApi =
		typeof spec.openapi === "string" || typeof spec.swagger === "string";

	if (isOpenApi && spec.paths === undefined) {
		if (isV31 && spec.webhooks !== undefined) {
			console.warn(
				"[parser] OpenAPI 3.1 spec without 'paths' (webhooks only) — normalized with paths: {}",
			);
		} else {
			console.warn("[parser] Spec without 'paths' — normalized with paths: {}");
		}
		spec.paths = {};
	}

	return spec;
}

export async function parseSpec(
	input: string | Record<string, unknown>,
): Promise<ParsedSpec> {
	const spec = typeof input === "string" ? tryParseJsonOrYaml(input) : input;
	const normalized = normalizeSpec(structuredClone(spec));

	let dereferenced: Record<string, unknown>;
	try {
		dereferenced = await (
			SwaggerParser.dereference as unknown as (
				api: Record<string, unknown>,
			) => Promise<Record<string, unknown>>
		)(normalized);
	} catch (err) {
		const originalMessage = err instanceof Error ? err.message : String(err);

		if (originalMessage.includes("[object Object]")) {
			throw new Error(
				"El spec OpenAPI no tiene la estructura esperada. " +
					"Asegúrate de que incluya 'openapi'/'swagger', 'info' y 'paths' o 'webhooks'.",
			);
		}

		throw new Error(`Error al procesar el spec OpenAPI: ${originalMessage}`, {
			cause: err,
		});
	}

	return extractFromDocument(dereferenced);
}

export async function parseSpecFromUrl(url: string): Promise<ParsedSpec> {
	let dereferenced: Record<string, unknown>;
	try {
		dereferenced = await (
			SwaggerParser.dereference as unknown as (
				api: string,
			) => Promise<Record<string, unknown>>
		)(url);
	} catch (err) {
		throw new Error(
			`Error al descargar o procesar el spec desde la URL: ${err instanceof Error ? err.message : String(err)}`,
			{ cause: err },
		);
	}

	return extractFromDocument(dereferenced);
}
