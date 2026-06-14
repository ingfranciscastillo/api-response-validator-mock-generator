import diff from "microdiff";

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export interface DiffEntry {
	type: "CREATE" | "REMOVE" | "CHANGE";
	path: string;
	value?: JsonValue;
	oldValue?: JsonValue;
	breaking: boolean;
	category: string;
}

export interface DiffResult {
	entries: DiffEntry[];
	hasBreaking: boolean;
}

function pathToString(pathSegments: (string | number)[]): string {
	return pathSegments
		.map((s) => (typeof s === "number" ? `[${s}]` : s))
		.join(".")
		.replace(/\.\[/g, "[");
}

function isFieldInSchema(
	schema: Record<string, unknown>,
	pathSegments: (string | number)[],
): boolean {
	let current: unknown = schema;
	for (const segment of pathSegments) {
		if (typeof segment === "number") {
			if (
				current &&
				typeof current === "object" &&
				"items" in (current as Record<string, unknown>)
			) {
				current = (current as Record<string, unknown>).items;
			} else {
				return false;
			}
		} else {
			if (
				current &&
				typeof current === "object" &&
				"properties" in (current as Record<string, unknown>)
			) {
				const props = (current as Record<string, unknown>).properties;
				if (
					props &&
					typeof props === "object" &&
					segment in (props as Record<string, unknown>)
				) {
					current = (props as Record<string, unknown>)[segment];
				} else {
					return false;
				}
			} else {
				return false;
			}
		}
	}
	return true;
}

function isFieldRequiredInSchema(
	schema: Record<string, unknown>,
	pathSegments: (string | number)[],
): boolean {
	if (pathSegments.length === 0) return false;
	const fieldName = String(pathSegments[pathSegments.length - 1]);
	if (typeof pathSegments[pathSegments.length - 1] === "number") return false;

	let current: unknown = schema;
	const parentSegments = pathSegments.slice(0, -1);
	for (const segment of parentSegments) {
		if (typeof segment === "number") {
			if (current && typeof current === "object") {
				current = (current as Record<string, unknown>).items;
			} else {
				return false;
			}
		} else {
			if (current && typeof current === "object") {
				const props = (current as Record<string, unknown>).properties;
				if (props && typeof props === "object") {
					current = (props as Record<string, unknown>)[segment];
				} else {
					return false;
				}
			} else {
				return false;
			}
		}
	}
	if (current && typeof current === "object") {
		const required = (current as Record<string, unknown>).required;
		return Array.isArray(required) && required.includes(fieldName);
	}
	return false;
}

function getFieldTypeFromSchema(
	schema: Record<string, unknown>,
	pathSegments: (string | number)[],
): string | undefined {
	let current: unknown = schema;
	for (const segment of pathSegments) {
		if (typeof segment === "number") {
			if (current && typeof current === "object") {
				current = (current as Record<string, unknown>).items;
			} else {
				return undefined;
			}
		} else {
			if (current && typeof current === "object") {
				const props = (current as Record<string, unknown>).properties;
				if (props && typeof props === "object") {
					current = (props as Record<string, unknown>)[segment];
				} else {
					return undefined;
				}
			} else {
				return undefined;
			}
		}
	}
	if (current && typeof current === "object") {
		const schemaObj = current as Record<string, unknown>;
		if (typeof schemaObj.type === "string") return schemaObj.type;
		if (Array.isArray(schemaObj.type) && schemaObj.type.length > 0) {
			return String(schemaObj.type[0]);
		}
		if (schemaObj.enum) return "enum";
	}
	return undefined;
}

function getEnumValues(
	schema: Record<string, unknown>,
	pathSegments: (string | number)[],
): unknown[] | undefined {
	let current: unknown = schema;
	for (const segment of pathSegments) {
		if (typeof segment === "number") {
			if (current && typeof current === "object") {
				current = (current as Record<string, unknown>).items;
			} else {
				return undefined;
			}
		} else {
			if (current && typeof current === "object") {
				const props = (current as Record<string, unknown>).properties;
				if (props && typeof props === "object") {
					current = (props as Record<string, unknown>)[segment];
				} else {
					return undefined;
				}
			} else {
				return undefined;
			}
		}
	}
	if (current && typeof current === "object") {
		const enumVal = (current as Record<string, unknown>).enum;
		if (Array.isArray(enumVal)) return enumVal;
	}
	return undefined;
}

type MicroDiffEntry = {
	type: "CREATE" | "REMOVE" | "CHANGE";
	path: (string | number)[];
	value?: unknown;
	oldValue?: unknown;
};

function toJson(v: unknown): JsonValue {
	return v as JsonValue;
}

export function computeDiff(
	actualResponse: unknown,
	expectedResponse: unknown,
	expectedSchema: Record<string, unknown> | null,
): DiffResult {
	const rawDiff = diff(
		actualResponse as Record<string, unknown>,
		expectedResponse as Record<string, unknown>,
	) as MicroDiffEntry[];

	const entries: DiffEntry[] = rawDiff.map((entry) => {
		const pathStr = pathToString(entry.path);
		let breaking = false;
		let category = "change";

		if (entry.type === "CREATE") {
			const inSchema = expectedSchema
				? isFieldInSchema(expectedSchema, entry.path)
				: false;
			if (!inSchema) {
				category = "undocumented_addition";
			} else {
				category = "new_field";
			}
		}

		if (entry.type === "REMOVE") {
			const required = expectedSchema
				? isFieldRequiredInSchema(expectedSchema, entry.path)
				: false;
			if (required) {
				breaking = true;
				category = "required_field_removed";
			} else {
				category = "optional_field_removed";
			}
		}

		if (entry.type === "CHANGE") {
			const schemaType = expectedSchema
				? getFieldTypeFromSchema(expectedSchema, entry.path)
				: undefined;
			const oldType = entry.oldValue === null ? "null" : typeof entry.oldValue;
			const newType = entry.value === null ? "null" : typeof entry.value;

			if (schemaType && oldType !== newType) {
				breaking = true;
				category = "type_change";
			}

			if (!breaking && schemaType === "enum" && expectedSchema) {
				const enumValues = getEnumValues(expectedSchema, entry.path);
				if (enumValues && !enumValues.includes(entry.value)) {
					breaking = true;
					category = "enum_violation";
				}
			}

			if (!breaking) {
				category = "value_change";
			}
		}

		return {
			type: entry.type,
			path: pathStr,
			value: toJson(entry.value),
			oldValue: toJson(entry.oldValue),
			breaking,
			category,
		};
	});

	const hasBreaking = entries.some((e) => e.breaking);

	return { entries, hasBreaking };
}
