import Ajv, { type ErrorObject } from "ajv";
import AjvErrors from "ajv-errors";
import addFormats from "ajv-formats";

export interface Violation {
	type: ViolationType;
	path: string;
	expected?: string;
	actual?: string;
	message: string;
	severity: "warning" | "error";
}

export type ViolationType =
	| "type_mismatch"
	| "missing_required"
	| "extra_field"
	| "enum_violation"
	| "format_invalid"
	| "null_not_allowed"
	| "array_item_invalid";

export interface ValidationResult {
	outcome: "pass" | "warning" | "fail";
	violations: Violation[];
}

let _ajv: Ajv | null = null;

function getAjv(): Ajv {
	if (!_ajv) {
		_ajv = new Ajv({ strict: false, allErrors: true });
		addFormats(_ajv);
		AjvErrors(_ajv);
	}
	return _ajv;
}

function resolveSchemaByPath(
	schema: Record<string, unknown>,
	path: string,
): Record<string, unknown> | null {
	const parts = path.replace(/^#?\//, "").split("/").filter(Boolean);
	let current: unknown = schema;
	for (const part of parts) {
		if (current && typeof current === "object" && !Array.isArray(current)) {
			current = (current as Record<string, unknown>)[part];
		} else {
			return null;
		}
	}
	if (current && typeof current === "object" && !Array.isArray(current)) {
		return current as Record<string, unknown>;
	}
	return null;
}

function getParentSchema(
	schema: Record<string, unknown>,
	instancePath: string,
): Record<string, unknown> | null {
	if (!instancePath || instancePath === "/") return schema;
	const lastSlash = instancePath.lastIndexOf("/");
	const parentPath = instancePath.slice(0, lastSlash);
	return resolveSchemaByPath(schema, parentPath);
}

function isFieldRequiredBySchema(
	schema: Record<string, unknown>,
	instancePath: string,
): boolean {
	const parts = instancePath.split("/").filter(Boolean);
	if (parts.length === 0) return false;
	const fieldName = parts[parts.length - 1];
	const parentSchema = getParentSchema(schema, instancePath);
	if (parentSchema && Array.isArray(parentSchema.required)) {
		return (parentSchema.required as string[]).includes(fieldName);
	}
	return false;
}

function getAdditionalPropertiesSetting(
	schema: Record<string, unknown>,
	instancePath: string,
): boolean | undefined {
	const parentSchema = getParentSchema(schema, instancePath);
	if (parentSchema === null) return undefined;
	const ap = parentSchema.additionalProperties;
	if (ap === false) return false;
	if (ap === true || ap === undefined) return true;
	return true;
}

function translateErrorToViolation(
	error: ErrorObject,
	schema: Record<string, unknown>,
): Violation {
	const path = error.instancePath.replace(/^\//, "").replace(/\//g, ".");
	const severity = determineSeverity(error, schema);

	switch (error.keyword) {
		case "required": {
			const missingProp = (error.params as { missingProperty: string })
				.missingProperty;
			const fullPath = path ? `${path}.${missingProp}` : missingProp;
			return {
				type: "missing_required",
				path: fullPath,
				expected: "present",
				actual: "missing",
				message: `Required field '${missingProp}' is missing`,
				severity,
			};
		}
		case "additionalProperties": {
			const prop = (error.params as { additionalProperty: string })
				.additionalProperty;
			const fullPath = path ? `${path}.${prop}` : prop;
			return {
				type: "extra_field",
				path: fullPath,
				message: `Unexpected field '${prop}'`,
				severity,
			};
		}
		case "type": {
			const params = error.params as {
				type: string;
				nullable?: boolean;
			};
			const actualType = error.data === null ? "null" : typeof error.data;
			if (params.nullable && error.data === null) {
				return {
					type: "null_not_allowed",
					path,
					expected: params.type,
					actual: "null",
					message: `Expected '${params.type}' but received null`,
					severity,
				};
			}
			return {
				type: "type_mismatch",
				path,
				expected: params.type,
				actual: actualType,
				message:
					error.message ??
					`Expected type '${params.type}' but received ${actualType}`,
				severity,
			};
		}
		case "enum": {
			const allowed = (error.params as { allowedValues: unknown[] })
				.allowedValues;
			return {
				type: "enum_violation",
				path,
				expected: allowed.map(String).join(" | "),
				actual: String(error.data),
				message: error.message ?? `Value must be one of: ${allowed.join(", ")}`,
				severity,
			};
		}
		case "format": {
			const format = (error.params as { format: string }).format;
			return {
				type: "format_invalid",
				path,
				expected: `format: ${format}`,
				actual: String(error.data),
				message: error.message ?? `Value does not match format '${format}'`,
				severity,
			};
		}
		case "minItems":
		case "maxItems":
		case "uniqueItems":
			return {
				type: "array_item_invalid",
				path,
				message: error.message ?? `Array validation failed: ${error.keyword}`,
				severity,
			};
		default:
			return {
				type: "type_mismatch",
				path,
				message: error.message ?? `Validation failed: ${error.keyword}`,
				severity,
			};
	}
}

function determineSeverity(
	error: ErrorObject,
	schema: Record<string, unknown>,
): "error" | "warning" {
	switch (error.keyword) {
		case "required":
			return "error";
		case "additionalProperties": {
			const setting = getAdditionalPropertiesSetting(
				schema,
				error.instancePath,
			);
			return setting === false ? "error" : "warning";
		}
		case "enum":
		case "format": {
			const required = isFieldRequiredBySchema(schema, error.instancePath);
			return required ? "error" : "warning";
		}
		default:
			return "error";
	}
}

export function validateResponseAgainstSchema(
	schema: Record<string, unknown>,
	responseBody: unknown,
): ValidationResult {
	const ajv = getAjv();
	const validate = ajv.compile(schema);
	const valid = validate(responseBody);

	if (valid) {
		return { outcome: "pass", violations: [] };
	}

	const violations = (validate.errors ?? []).map((error) =>
		translateErrorToViolation(error, schema),
	);

	const seen = new Set<string>();
	const uniqueViolations = violations.filter((v) => {
		const key = `${v.path}:${v.type}`;
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});

	const outcome = determineOutcome(uniqueViolations);

	return { outcome, violations: uniqueViolations };
}

function determineOutcome(
	violations: Violation[],
): "pass" | "warning" | "fail" {
	if (violations.length === 0) return "pass";
	const hasError = violations.some((v) => v.severity === "error");
	return hasError ? "fail" : "warning";
}
