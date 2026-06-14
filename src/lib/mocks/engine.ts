import { fakerEN as faker } from "@faker-js/faker";
import { generate } from "json-schema-faker";

faker.seed(Math.floor(Math.random() * 1000000));

export type JsonValue =
	| string
	| number
	| boolean
	| null
	| JsonValue[]
	| { [key: string]: JsonValue };

export interface GenerationRule {
	type: "static" | "faker" | "pattern";
	value?: unknown;
	method?: string;
	regex?: string;
}

export interface GenerationRules {
	fieldOverrides?: Record<string, GenerationRule>;
	locale?: string;
	arrayLength?: { min: number; max: number };
}

function setDeep(
	obj: Record<string, unknown>,
	path: string,
	value: unknown,
): void {
	const parts = path.split(".");
	let current = obj;
	for (let i = 0; i < parts.length - 1; i++) {
		const part = parts[i];
		if (part.endsWith("[]")) {
			const key = part.slice(0, -2);
			if (!current[key] || !Array.isArray(current[key])) {
				current[key] = [{}];
			}
			const arr = current[key] as Array<Record<string, unknown>>;
			if (arr.length === 0) arr.push({});
			current = arr[0];
		} else {
			if (!current[part] || typeof current[part] !== "object") {
				current[part] = {};
			}
			current = current[part] as Record<string, unknown>;
		}
	}
	const lastPart = parts[parts.length - 1];
	current[lastPart] = value;
}

function applyFieldOverrides(
	payload: Record<string, unknown>,
	rules: GenerationRules,
): Record<string, unknown> {
	if (!rules.fieldOverrides) return payload;

	for (const [path, rule] of Object.entries(rules.fieldOverrides)) {
		switch (rule.type) {
			case "static":
				setDeep(payload, path, rule.value);
				break;
			case "faker": {
				if (rule.method) {
					const methodPath = rule.method.split(".");
					let fakerModule: Record<string, unknown> = faker as unknown as Record<
						string,
						unknown
					>;
					for (const segment of methodPath.slice(0, -1)) {
						fakerModule = fakerModule[segment] as Record<string, unknown>;
					}
					const methodName = methodPath[methodPath.length - 1];
					const fn = fakerModule[methodName] as () => unknown;
					if (typeof fn === "function") {
						setDeep(payload, path, fn());
					}
				}
				break;
			}
			case "pattern":
				if (rule.regex) {
					setDeep(payload, path, `[${rule.regex}]`);
				}
				break;
		}
	}

	return payload;
}

export async function generateMock(
	schema: Record<string, unknown>,
	rules?: GenerationRules | null,
	seed?: number | string | null,
): Promise<JsonValue> {
	const seedValue = seed ? Number(seed) : Math.floor(Math.random() * 1000000);
	faker.seed(seedValue);

	let payload = (await generate(schema, { seed: seedValue })) as Record<
		string,
		unknown
	> | null;

	if (!payload || typeof payload !== "object") {
		payload = {};
	}

	if (rules) {
		payload = applyFieldOverrides(payload, rules);
	}

	return payload as JsonValue;
}

export async function generateMockVariants(
	schema: Record<string, unknown>,
	count: number,
	rules?: GenerationRules | null,
	seed?: number | string | null,
): Promise<JsonValue[]> {
	const baseSeed = seed ? Number(seed) : Math.floor(Math.random() * 1000000);
	const variants: JsonValue[] = [];

	for (let i = 0; i < count; i++) {
		const variant = await generateMock(schema, rules, baseSeed + i);
		variants.push(variant);
	}

	return variants;
}

export async function generateEdgeCaseMocks(
	schema: Record<string, unknown>,
): Promise<JsonValue[]> {
	const mocks: JsonValue[] = [];

	const emptySchema = produceEdgeVariant(schema, "empty");
	mocks.push(await generateMock(emptySchema));

	const nullSchema = produceEdgeVariant(schema, "nulls");
	mocks.push(await generateMock(nullSchema));

	const boundarySchema = produceEdgeVariant(schema, "boundary");
	mocks.push(await generateMock(boundarySchema));

	return mocks;
}

function produceEdgeVariant(
	schema: Record<string, unknown>,
	variant: "empty" | "nulls" | "boundary",
): Record<string, unknown> {
	const result = { ...schema };

	if (result.type === "array" && variant === "empty") {
		return { ...result, items: result.items || {}, minItems: 0, maxItems: 0 };
	}

	if (result.type === "object" && result.properties) {
		const props = result.properties as Record<string, unknown>;
		const newProps: Record<string, unknown> = {};

		for (const [key, propSchema] of Object.entries(props)) {
			const ps = propSchema as Record<string, unknown>;

			if (variant === "nulls" && ps.nullable) {
				newProps[key] = { ...ps, enum: [null] };
			} else if (variant === "empty" && ps.type === "array") {
				newProps[key] = { ...ps, minItems: 0, maxItems: 0 };
			} else if (variant === "empty" && ps.type === "object") {
				newProps[key] = produceEdgeVariant(ps, "empty");
			} else if (variant === "boundary") {
				newProps[key] = applyBoundary(ps);
			} else {
				newProps[key] = ps;
			}
		}

		return { ...result, properties: newProps };
	}

	return result;
}

function applyBoundary(
	schema: Record<string, unknown>,
): Record<string, unknown> {
	const result = { ...schema };

	if (schema.type === "string") {
		if (schema.minLength !== undefined) {
			result.minLength = schema.minLength as number;
			result.maxLength = schema.minLength as number;
		} else {
			result.minLength = 0;
			result.maxLength = 0;
		}
	}

	if (schema.type === "number" || schema.type === "integer") {
		if (schema.minimum !== undefined) {
			result.enum = [schema.minimum];
		} else if (schema.maximum !== undefined) {
			result.enum = [schema.maximum];
		} else {
			result.enum = [0];
		}
	}

	if (schema.type === "array") {
		if (schema.minItems !== undefined) {
			result.minItems = schema.minItems as number;
			result.maxItems = schema.minItems as number;
		} else {
			result.minItems = 0;
			result.maxItems = 0;
		}
	}

	return result;
}

export async function generateErrorMocks(
	errorSchemas: Array<{ statusCode: number; schema: Record<string, unknown> }>,
): Promise<Array<{ statusCode: number; payload: JsonValue }>> {
	const results: Array<{
		statusCode: number;
		payload: JsonValue;
	}> = [];

	for (const { statusCode, schema } of errorSchemas) {
		const payload = await generateMock(schema);
		results.push({ statusCode, payload });
	}

	return results;
}
