import { getRequestHeaders } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { apiKey } from "@/db/schema";

export class ApiKeyError extends Error {
	constructor(
		message: string,
		public statusCode: number,
	) {
		super(message);
		this.name = "ApiKeyError";
	}
}

export async function validateApiKey(
	requiredScope: string,
): Promise<{ workspaceId: string; keyId: string }> {
	const headers = getRequestHeaders();
	const authHeader = headers.get("authorization");

	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		throw new ApiKeyError("Missing or invalid Authorization header", 401);
	}

	const rawKey = authHeader.slice("Bearer ".length).trim();
	if (!rawKey) {
		throw new ApiKeyError("Missing API key", 401);
	}

	const keyHash = await globalThis.crypto.subtle
		.digest("SHA-256", new TextEncoder().encode(rawKey))
		.then((buf) => {
			const hashArray = Array.from(new Uint8Array(buf));
			return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
		});

	const key = await db
		.select()
		.from(apiKey)
		.where(eq(apiKey.keyHash, keyHash))
		.then((r) => r[0] ?? null);

	if (!key) {
		throw new ApiKeyError("Invalid API key", 401);
	}

	if (key.expiresAt && new Date() > key.expiresAt) {
		throw new ApiKeyError("API key has expired", 401);
	}

	const scopes = (Array.isArray(key.scopes) ? key.scopes : []) as string[];
	if (!scopes.includes(requiredScope)) {
		throw new ApiKeyError(
			`API key does not have the required scope: ${requiredScope}`,
			403,
		);
	}

	await db
		.update(apiKey)
		.set({ lastUsedAt: new Date() })
		.where(eq(apiKey.id, key.id));

	return { workspaceId: key.workspaceId, keyId: key.id };
}
