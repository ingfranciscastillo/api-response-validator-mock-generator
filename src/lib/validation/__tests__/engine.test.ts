import { describe, expect, it } from "vitest";
import { validateResponseAgainstSchema } from "../engine";

describe("validateResponseAgainstSchema", () => {
	it("passes when response matches schema", () => {
		const schema = {
			type: "object",
			properties: {
				name: { type: "string" },
				age: { type: "number" },
			},
			required: ["name"],
		};

		const result = validateResponseAgainstSchema(schema, {
			name: "Alice",
			age: 30,
		});

		expect(result.outcome).toBe("pass");
		expect(result.violations).toHaveLength(0);
	});

	it("fails when required field is missing", () => {
		const schema = {
			type: "object",
			properties: {
				name: { type: "string" },
				age: { type: "number" },
			},
			required: ["name"],
		};

		const result = validateResponseAgainstSchema(schema, {
			age: 30,
		});

		expect(result.outcome).toBe("fail");
		expect(result.violations).toHaveLength(1);
		expect(result.violations[0].type).toBe("missing_required");
		expect(result.violations[0].severity).toBe("error");
		expect(result.violations[0].path).toBe("name");
	});

	it("does not flag extra fields when additionalProperties is not set", () => {
		const schema = {
			type: "object",
			properties: {
				name: { type: "string" },
			},
		};

		const result = validateResponseAgainstSchema(schema, {
			name: "Alice",
			extraField: "unexpected",
		});

		expect(result.outcome).toBe("pass");
		expect(result.violations).toHaveLength(0);
	});

	it("errors on extra field when additionalProperties is false", () => {
		const schema = {
			type: "object",
			properties: {
				name: { type: "string" },
			},
			additionalProperties: false,
		};

		const result = validateResponseAgainstSchema(schema, {
			name: "Alice",
			extraField: "unexpected",
		});

		expect(result.outcome).toBe("fail");
		expect(result.violations).toHaveLength(1);
		expect(result.violations[0].type).toBe("extra_field");
		expect(result.violations[0].severity).toBe("error");
	});

	it("detects type mismatch", () => {
		const schema = {
			type: "object",
			properties: {
				age: { type: "number" },
			},
		};

		const result = validateResponseAgainstSchema(schema, {
			age: "not-a-number",
		});

		expect(result.outcome).toBe("fail");
		expect(result.violations[0].type).toBe("type_mismatch");
	});

	it("detects enum violations", () => {
		const schema = {
			type: "object",
			properties: {
				role: { type: "string", enum: ["admin", "user"] },
			},
			required: ["role"],
		};

		const result = validateResponseAgainstSchema(schema, {
			role: "superadmin",
		});

		expect(result.outcome).toBe("fail");
		expect(result.violations[0].type).toBe("enum_violation");
	});

	it("detects format invalid values", () => {
		const schema = {
			type: "object",
			properties: {
				email: { type: "string", format: "email" },
			},
			required: ["email"],
		};

		const result = validateResponseAgainstSchema(schema, {
			email: "not-an-email",
		});

		expect(result.outcome).toBe("fail");
		expect(result.violations[0].type).toBe("format_invalid");
	});

	it("handles nested object validation", () => {
		const schema = {
			type: "object",
			properties: {
				user: {
					type: "object",
					properties: {
						name: { type: "string" },
					},
					required: ["name"],
				},
			},
			required: ["user"],
		};

		const result = validateResponseAgainstSchema(schema, {
			user: {},
		});

		expect(result.outcome).toBe("fail");
		expect(result.violations[0].type).toBe("missing_required");
	});

	it("returns pass for empty schema", () => {
		const result = validateResponseAgainstSchema({}, { any: "data" });
		expect(result.outcome).toBe("pass");
	});

	it("handles null response with nullable schema", () => {
		const schema = {
			type: "object",
			properties: {
				name: { type: "string" },
			},
			nullable: true,
		};

		const result = validateResponseAgainstSchema(schema, null);
		expect(result.outcome).toBe("pass");
	});

	it("handles array responses", () => {
		const schema = {
			type: "array",
			items: { type: "string" },
		};

		const result = validateResponseAgainstSchema(schema, ["a", "b", 1]);
		expect(result.outcome).toBe("fail");
		expect(result.violations[0].type).toBe("type_mismatch");
	});
});
