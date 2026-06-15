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

function extractEndpoints(
	paths: Record<string, Record<string, unknown>> | undefined,
): ParsedEndpoint[] {
	if (!paths) return [];

	const endpoints: ParsedEndpoint[] = [];
	const httpMethods = [
		"get",
		"post",
		"put",
		"patch",
		"delete",
		"options",
		"head",
		"trace",
	];

	for (const [path, pathItem] of Object.entries(paths)) {
		if (!pathItem || typeof pathItem !== "object") continue;

		for (const [method, operation] of Object.entries(pathItem)) {
			const normalized = normalizeMethod(method);
			if (!httpMethods.includes(normalized)) continue;
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

export async function parseSpec(
	input: string | Record<string, unknown>,
): Promise<ParsedSpec> {
	const spec = typeof input === "string" ? tryParseJsonOrYaml(input) : input;

	const dereferenced = await SwaggerParser.dereference(
		structuredClone(spec) as unknown as string,
	);

	const d = dereferenced as unknown as Record<string, unknown>;
	const info = d.info as Record<string, unknown> | undefined;
	const paths = d.paths as Record<string, Record<string, unknown>> | undefined;

	const endpoints = extractEndpoints(paths);
	const tags = extractTags(paths);

	const serverUrl = extractServerUrl(d);

	return {
		title: (info?.title as string) ?? "Untitled Spec",
		version: (info?.version as string) ?? "1.0.0",
		description: (info?.description as string | null) ?? null,
		endpoints,
		tags,
		serverUrl,
	};
}

export async function parseSpecFromUrl(url: string): Promise<ParsedSpec> {
	const dereferenced = await SwaggerParser.dereference(url);
	return parseSpec(dereferenced as unknown as Record<string, unknown>);
}
