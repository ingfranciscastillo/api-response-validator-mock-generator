import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { notificationChannel } from "@/db/schema";
import { auth } from "@/lib/auth";

export const getNotificationChannels = createServerFn({ method: "GET" })
	.validator((input: { organizationId: string }) => input)
	.handler(async ({ data }) => {
		const headers = getRequestHeaders();
		const session = await auth.api.getSession({ headers });
		if (!session) throw new Error("Unauthorized");

		return db
			.select()
			.from(notificationChannel)
			.where(eq(notificationChannel.workspaceId, data.organizationId))
			.orderBy(desc(notificationChannel.createdAt));
	});

export const saveNotificationChannel = createServerFn({ method: "POST" })
	.validator(
		(input: {
			organizationId: string;
			id?: string;
			name: string;
			type: string;
			config: Record<string, unknown>;
			enabled?: boolean;
		}) => input,
	)
	.handler(async ({ data }) => {
		const headers = getRequestHeaders();
		const session = await auth.api.getSession({ headers });
		if (!session) throw new Error("Unauthorized");

		if (data.id) {
			await db
				.update(notificationChannel)
				.set({
					name: data.name,
					type: data.type,
					config: data.config,
					enabled: data.enabled ?? true,
				})
				.where(eq(notificationChannel.id, data.id));
			return { id: data.id };
		}

		const id = crypto.randomUUID();
		await db.insert(notificationChannel).values({
			id,
			workspaceId: data.organizationId,
			name: data.name,
			type: data.type,
			config: data.config,
			enabled: data.enabled ?? true,
		});
		return { id };
	});

export const deleteNotificationChannel = createServerFn({ method: "POST" })
	.validator((input: { channelId: string }) => input)
	.handler(async ({ data }) => {
		const headers = getRequestHeaders();
		const session = await auth.api.getSession({ headers });
		if (!session) throw new Error("Unauthorized");

		await db
			.delete(notificationChannel)
			.where(eq(notificationChannel.id, data.channelId));
		return { success: true };
	});
