import { describe, expect, it } from "vitest";
import {
	generateEdgeCaseMocks,
	generateErrorMocks,
	generateMock,
	generateMockVariants,
} from "../engine";

const petSchema = {
	type: "object",
	properties: {
		id: { type: "integer" },
		name: { type: "string" },
		tag: { type: "string" },
	},
	required: ["id", "name"],
};

const userSchema = {
	type: "object",
	properties: {
		id: { type: "integer" },
		email: { type: "string", format: "email" },
		profile: {
			type: "object",
			properties: {
				firstName: { type: "string" },
				lastName: { type: "string" },
				age: { type: "integer", minimum: 0, maximum: 150 },
			},
			required: ["firstName", "lastName"],
		},
	},
	required: ["id", "email"],
};

const arraySchema = {
	type: "array",
	items: { type: "string" },
	minItems: 1,
	maxItems: 5,
};

describe("generateMock", () => {
	it("generates a mock object from a simple schema", async () => {
		const result = await generateMock(petSchema);
		expect(result).toBeTruthy();
		expect(typeof result).toBe("object");
		expect(result).not.toBeNull();
	});

	it("includes required fields", async () => {
		const result = (await generateMock(petSchema)) as Record<string, unknown>;
		expect(result).toHaveProperty("id");
		expect(result).toHaveProperty("name");
	});

	it("produces reproducible output with the same seed", async () => {
		const a = await generateMock(userSchema, null, 42);
		const b = await generateMock(userSchema, null, 42);
		expect(a).toEqual(b);
	});

	it("produces different output with different seeds", async () => {
		const a = await generateMock(userSchema, null, 42);
		const b = await generateMock(userSchema, null, 99);
		expect(a).not.toEqual(b);
	});

	it("applies static field override", async () => {
		const result = (await generateMock(petSchema, {
			fieldOverrides: {
				name: { type: "static", value: "Buddy" },
			},
		})) as Record<string, unknown>;
		expect(result.name).toBe("Buddy");
	});

	it("generates nested object properties", async () => {
		const result = (await generateMock(userSchema)) as Record<string, unknown>;
		const profile = result.profile as Record<string, unknown>;
		expect(profile).toBeTruthy();
		expect(typeof profile).toBe("object");
	});

	it("handles null or undefined schema gracefully", async () => {
		await expect(generateMock({})).resolves.toBeTruthy();
	});
});

describe("generateMockVariants", () => {
	it("returns the requested number of variants", async () => {
		const results = await generateMockVariants(petSchema, 3);
		expect(results).toHaveLength(3);
	});

	it("returns unique variants with auto-seeding", async () => {
		const results = await generateMockVariants(petSchema, 2, null, 42);
		expect(results[0]).not.toEqual(results[1]);
	});

	it("returns empty array when count is 0", async () => {
		const results = await generateMockVariants(petSchema, 0);
		expect(results).toHaveLength(0);
	});
});

describe("generateEdgeCaseMocks", () => {
	it("returns three edge case variants", async () => {
		const results = await generateEdgeCaseMocks(petSchema);
		expect(results).toHaveLength(3);
	});

	it("works with array schemas", async () => {
		const results = await generateEdgeCaseMocks(arraySchema);
		expect(results).toHaveLength(3);
	});
});

describe("generateErrorMocks", () => {
	it("returns payloads for each error schema", async () => {
		const results = await generateErrorMocks([
			{
				statusCode: 400,
				schema: { type: "object", properties: { message: { type: "string" } } },
			},
			{
				statusCode: 500,
				schema: { type: "object", properties: { error: { type: "string" } } },
			},
		]);
		expect(results).toHaveLength(2);
		expect(results[0].statusCode).toBe(400);
		expect(results[1].statusCode).toBe(500);
	});
});
