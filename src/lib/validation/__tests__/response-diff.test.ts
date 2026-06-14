import { describe, expect, it } from "vitest";
import { computeDiff } from "../response-diff";

/**
 * microdiff(obj1, obj2) semantics:
 *   CREATE  → property in obj2 but NOT in obj1
 *   REMOVE  → property in obj1 but NOT in obj2
 *   CHANGE  → property in both but values differ
 *
 * computeDiff(actual, expected, schema):
 *   obj1 = actual API response
 *   obj2 = expected response
 */

describe("computeDiff", () => {
	it("returns empty entries for identical responses", () => {
		const actual = { name: "Alice", age: 30 };
		const expected = { name: "Alice", age: 30 };

		const result = computeDiff(actual, expected, null);

		expect(result.entries).toHaveLength(0);
		expect(result.hasBreaking).toBe(false);
	});

	it("detects REMOVE for extra field in actual that is not in expected", () => {
		const actual = { name: "Alice", extra: "new" };
		const expected = { name: "Alice" };
		const schema = {
			type: "object",
			properties: { name: { type: "string" } },
		};

		const result = computeDiff(actual, expected, schema);

		const removes = result.entries.filter((e) => e.type === "REMOVE");
		expect(removes).toHaveLength(1);
		expect(removes[0].category).toBe("optional_field_removed");
		expect(removes[0].breaking).toBe(false);
	});

	it("detects CREATE for field in expected but missing from actual", () => {
		const actual = { name: "Alice" };
		const expected = { name: "Alice", age: 30 };
		const schema = {
			type: "object",
			properties: {
				name: { type: "string" },
				age: { type: "number" },
			},
		};

		const result = computeDiff(actual, expected, schema);

		const creates = result.entries.filter((e) => e.type === "CREATE");
		expect(creates).toHaveLength(1);
		expect(creates[0].category).toBe("new_field");
	});

	it("detects CHANGE with type mismatch as breaking", () => {
		const actual = { age: "30" };
		const expected = { age: 30 };
		const schema = {
			type: "object",
			properties: { age: { type: "number" } },
		};

		const result = computeDiff(actual, expected, schema);

		const changes = result.entries.filter((e) => e.type === "CHANGE");
		const typeChange = changes.find((e) => e.category === "type_change");
		expect(typeChange).toBeDefined();
		expect(typeChange?.breaking).toBe(true);
		expect(result.hasBreaking).toBe(true);
	});

	it("detects CHANGE with enum violation as breaking", () => {
		const actual = { role: "superadmin" };
		const expected = { role: "admin" };
		const schema = {
			type: "object",
			properties: {
				role: { enum: ["admin", "user"] },
			},
		};

		const result = computeDiff(actual, expected, schema);

		const enumViolation = result.entries.find(
			(e) => e.category === "enum_violation",
		);
		expect(enumViolation).toBeDefined();
		expect(enumViolation?.breaking).toBe(true);
		expect(result.hasBreaking).toBe(true);
	});

	it("detects CHANGE value change as non-breaking", () => {
		const actual = { age: 31 };
		const expected = { age: 30 };
		const schema = {
			type: "object",
			properties: { age: { type: "number" } },
		};

		const result = computeDiff(actual, expected, schema);

		const valueChange = result.entries.find(
			(e) => e.category === "value_change",
		);
		expect(valueChange).toBeDefined();
		expect(valueChange?.breaking).toBe(false);
	});

	it("handles nested object diffs", () => {
		const actual = { user: { name: "Alice", extra: "field" } };
		const expected = { user: { name: "Alice" } };
		const schema = {
			type: "object",
			properties: {
				user: {
					type: "object",
					properties: { name: { type: "string" } },
				},
			},
		};

		const result = computeDiff(actual, expected, schema);

		expect(result.entries.length).toBeGreaterThan(0);
	});

	it("handles array diffs", () => {
		const actual = { items: [1, 2, 3] };
		const expected = { items: [1, 2] };
		const schema = {
			type: "object",
			properties: {
				items: {
					type: "array",
					items: { type: "number" },
				},
			},
		};

		const result = computeDiff(actual, expected, schema);

		expect(result.entries.length).toBeGreaterThan(0);
	});

	it("returns hasBreaking false when no breaking changes", () => {
		const actual = { name: "Alice" };
		const expected = { name: "Alice" };

		const result = computeDiff(actual, expected, null);

		expect(result.hasBreaking).toBe(false);
	});
});
