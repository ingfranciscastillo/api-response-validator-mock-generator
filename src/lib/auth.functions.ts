import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import { db } from "#/db";
import { session as sessionTable } from "#/db/schema";
import { auth } from "@/lib/auth";

export const getSession = createServerFn({ method: "GET" }).handler(
	async () => {
		const headers = getRequestHeaders();
		const session = await auth.api.getSession({ headers });

		return session;
	},
);

export const ensureSession = createServerFn({ method: "GET" }).handler(
	async () => {
		const headers = getRequestHeaders();
		const session = await auth.api.getSession({ headers });

		if (!session) {
			throw new Error("Unauthorized");
		}

		return session;
	},
);

export const viewBackupCodes = createServerFn({ method: "POST" }).handler(
	async () => {
		const headers = getRequestHeaders();
		const authSession = await auth.api.getSession({ headers });
		if (!authSession?.user?.id) throw new Error("Unauthorized");

		const result = await auth.api.viewBackupCodes({
			body: { userId: authSession.user.id },
			headers,
		});

		return result;
	},
);

export const listUserSessions = createServerFn({ method: "GET" }).handler(
	async () => {
		const headers = getRequestHeaders();
		const authSession = await auth.api.getSession({ headers });
		if (!authSession?.user?.id) throw new Error("Unauthorized");

		const sessions = await db
			.select({
				id: sessionTable.id,
				createdAt: sessionTable.createdAt,
				expiresAt: sessionTable.expiresAt,
				ipAddress: sessionTable.ipAddress,
				userAgent: sessionTable.userAgent,
			})
			.from(sessionTable)
			.where(eq(sessionTable.userId, authSession.user.id))
			.orderBy(sessionTable.createdAt)
			.limit(50);

		return sessions.reverse();
	},
);
