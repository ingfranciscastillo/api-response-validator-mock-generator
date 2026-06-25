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

const PROTO_KEYS = new Set(["__proto__", "constructor", "prototype"]);

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
			if (PROTO_KEYS.has(part)) continue;
			if (!current[part] || typeof current[part] !== "object") {
				current[part] = {};
			}
			current = current[part] as Record<string, unknown>;
		}
	}
	const lastPart = parts[parts.length - 1];
	if (!PROTO_KEYS.has(lastPart)) {
		current[lastPart] = value;
	}
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
						if (PROTO_KEYS.has(segment)) break;
						fakerModule = fakerModule[segment] as Record<string, unknown>;
					}
					const methodName = methodPath[methodPath.length - 1];
					if (PROTO_KEYS.has(methodName)) break;
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

function fakerifyValue(
	key: string,
	propSchema: Record<string, unknown>,
): unknown {
	const type = propSchema.type as string | undefined;
	const enumValues = propSchema.enum as Array<unknown> | undefined;

	if (enumValues) {
		return faker.helpers.arrayElement(enumValues);
	}

	if (type === "string") {
		const format = propSchema.format as string | undefined;
		if (format === "date" || format === "date-time") {
			return faker.date.recent().toISOString();
		}
		if (format === "email") return faker.internet.email();
		if (format === "uri" || format === "url") return faker.internet.url();
		if (format === "phone") return faker.phone.number();
		if (format === "uuid") return faker.string.uuid();

		return generateFakerString(key);
	}

	if (type === "integer") {
		const min = (propSchema.minimum as number) ?? 0;
		const max = (propSchema.maximum as number) ?? 9999;
		return faker.number.int({ min, max });
	}

	if (type === "number") {
		const min = (propSchema.minimum as number) ?? 0;
		const max = (propSchema.maximum as number) ?? 9999;
		return faker.number.float({ min, max, fractionDigits: 2 });
	}

	if (type === "boolean") {
		return faker.datatype.boolean();
	}

	return undefined;
}

const STRING_RULES: Array<{
	test: (name: string) => boolean;
	fn: () => string;
}> = [
	{
		test: (n) => /^first[_ ]?name$|^nombre$|^nombre_pila$/i.test(n),
		fn: () => faker.person.firstName(),
	},
	{
		test: (n) => /^last[_ ]?name$|^apellido/i.test(n),
		fn: () => faker.person.lastName(),
	},
	{
		test: (n) => /^full[_ ]?name$|^nombre_completo/i.test(n),
		fn: () => faker.person.fullName(),
	},
	{
		test: (n) => /^username$|^usuario$/i.test(n),
		fn: () => faker.internet.username(),
	},
	{ test: (n) => /name|nombre/.test(n), fn: () => faker.person.firstName() },
	{
		test: (n) => /^email$|^correo$/i.test(n),
		fn: () => faker.internet.email(),
	},
	{
		test: (n) => /^phone$|^tel[eé]fono$|^celular$|^m[oó]vil$/i.test(n),
		fn: () => faker.phone.number(),
	},
	{
		test: (n) => /^address$|^direcci[oó]n$/i.test(n),
		fn: () => faker.location.streetAddress(),
	},
	{ test: (n) => /^city$|^ciudad$/i.test(n), fn: () => faker.location.city() },
	{
		test: (n) => /^state$|^estado$|^provincia$/i.test(n),
		fn: () => faker.location.state(),
	},
	{
		test: (n) => /^country$|^pa[ií]s$/i.test(n),
		fn: () => faker.location.country(),
	},
	{
		test: (n) => /^zip|^postal|c[oó]digo.postal/i.test(n),
		fn: () => faker.location.zipCode(),
	},
	{
		test: (n) => /^street$|^calle$/i.test(n),
		fn: () => faker.location.street(),
	},
	{
		test: (n) => /^company$|^empresa$/i.test(n),
		fn: () => faker.company.name(),
	},
	{
		test: (n) => /^job$|^title$|^cargo$|^puesto$|position/i.test(n),
		fn: () => faker.person.jobTitle(),
	},
	{
		test: (n) => /^description$|^descripci[oó]n$/i.test(n),
		fn: () => faker.lorem.sentence(),
	},
	{
		test: (n) => /^summary$|^resumen$/i.test(n),
		fn: () => faker.lorem.paragraph(),
	},
	{
		test: (n) => /^title$|^t[ií]tulo$/i.test(n),
		fn: () => faker.lorem.sentence(),
	},
	{
		test: (n) => /^content$|^contenido$/i.test(n),
		fn: () => faker.lorem.paragraphs(2),
	},
	{
		test: (n) => /^message$|^mensaje$/i.test(n),
		fn: () => faker.lorem.sentence(),
	},
	{
		test: (n) => /^comment$|^comentario$/i.test(n),
		fn: () => faker.lorem.sentence(),
	},
	{
		test: (n) => /^url$|^website$|^sitio$/i.test(n),
		fn: () => faker.internet.url(),
	},
	{
		test: (n) => /^avatar$|^photo$|^foto$|^imagen$|^image$/i.test(n),
		fn: () => faker.image.avatar(),
	},
	{ test: (n) => /^uuid$|^id$/i.test(n), fn: () => faker.string.uuid() },
	{ test: (n) => /^token$/i.test(n), fn: () => faker.string.alphanumeric(32) },
	{ test: (n) => /^color$/i.test(n), fn: () => faker.color.human() },
	{
		test: (n) => /^category$|^categor[ií]a$/i.test(n),
		fn: () => faker.commerce.department(),
	},
	{
		test: (n) => /^product$|^producto$/i.test(n),
		fn: () => faker.commerce.productName(),
	},
	{
		test: (n) => /^price$|^precio$/i.test(n),
		fn: () => faker.commerce.price(),
	},
	{
		test: (n) => /^quantity$|^cantidad$/i.test(n),
		fn: () => String(faker.number.int({ min: 1, max: 100 })),
	},
	{
		test: (n) => /^date$|^fecha$/i.test(n),
		fn: () => faker.date.recent().toISOString(),
	},
	{
		test: (n) => /^status$/i.test(n),
		fn: () =>
			faker.helpers.arrayElement([
				"active",
				"inactive",
				"pending",
				"completed",
				"failed",
			]),
	},
	{
		test: (n) => /^type$|^tipo$/i.test(n),
		fn: () => faker.helpers.arrayElement(["A", "B", "C"]),
	},
	{
		test: (n) => /^language$|^idioma$/i.test(n),
		fn: () => faker.helpers.arrayElement(["en", "es", "fr", "de", "ja"]),
	},
	{ test: (n) => /^role$|^rol$/i.test(n), fn: () => faker.person.jobTitle() },
	{
		test: (n) => /^gender$|^g[ée]nero$/i.test(n),
		fn: () => faker.helpers.arrayElement(["male", "female", "other"]),
	},
	{
		test: (n) => /^birthday$|^birth_date$|^cumpleaños$/i.test(n),
		fn: () => faker.date.birthdate().toISOString(),
	},
	{
		test: (n) => /^age$|^edad$/i.test(n),
		fn: () => String(faker.number.int({ min: 18, max: 90 })),
	},
	{
		test: (n) => /^rating$|^puntuaci[oó]n$/i.test(n),
		fn: () => String(faker.number.int({ min: 1, max: 5 })),
	},
	{
		test: (n) => /^score$|^puntaje$/i.test(n),
		fn: () => String(faker.number.int({ min: 0, max: 100 })),
	},
	{
		test: (n) => /^error$|^errores$/i.test(n),
		fn: () => faker.lorem.sentence(),
	},
];

function generateFakerString(propertyName: string): string {
	const lower = propertyName.replace(/[-_\s]/g, "_");
	for (const rule of STRING_RULES) {
		if (rule.test(lower)) return rule.fn();
	}
	return faker.lorem.word();
}

function generateNestedObject(
	schema: Record<string, unknown>,
): Record<string, unknown> {
	const obj: Record<string, unknown> = {};
	const props = schema.properties as Record<string, unknown> | undefined;
	if (!props) return obj;

	for (const [key, propSchema] of Object.entries(props)) {
		const ps = propSchema as Record<string, unknown>;
		const propType = ps.type as string | undefined;

		if (propType === "object") {
			obj[key] = generateNestedObject(ps);
		} else if (propType === "array") {
			obj[key] = [];
		} else {
			const value = fakerifyValue(key, ps);
			if (value !== undefined) obj[key] = value;
		}
	}
	return obj;
}

function fakerifyPayload(
	payload: unknown,
	schema: Record<string, unknown>,
	propertyName?: string,
): unknown {
	if (payload === null || payload === undefined) return payload;

	const schemaType = schema.type as string | undefined;
	const props = schema.properties as Record<string, unknown> | undefined;
	const items = schema.items as Record<string, unknown> | undefined;

	if (
		schemaType === "object" &&
		props &&
		typeof payload === "object" &&
		!Array.isArray(payload)
	) {
		const obj = payload as Record<string, unknown>;
		for (const [key, propSchema] of Object.entries(props)) {
			const ps = propSchema as Record<string, unknown>;
			const propType = ps.type as string | undefined;

			if (propType === "object" && ps.properties) {
				obj[key] = fakerifyPayload(obj[key], ps, key);
				if (obj[key] === undefined) {
					obj[key] = generateNestedObject(ps);
				}
			} else if (propType === "array" && ps.items) {
				obj[key] = fakerifyPayload(obj[key], ps, key);
			} else {
				const value = fakerifyValue(key, ps);
				if (value !== undefined) obj[key] = value;
			}
		}
		return obj;
	}

	if (schemaType === "array" && Array.isArray(payload) && items) {
		return (payload as Array<unknown>).map((item) =>
			fakerifyPayload(item, items, propertyName),
		);
	}

	if (propertyName && (schemaType === "string" || !schemaType)) {
		const value = fakerifyValue(propertyName, schema);
		if (value !== undefined) return value;
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

	payload = fakerifyPayload(payload, schema) as Record<string, unknown>;

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
