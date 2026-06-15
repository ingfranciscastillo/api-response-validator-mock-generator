import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { notificationChannel } from "@/db/schema";
import { requireOrg } from "@/lib/auth/org";

export const getNotificationChannels = createServerFn({
	method: "GET",
}).handler(async () => {
	const { orgId } = await requireOrg();

	return db
		.select()
		.from(notificationChannel)
		.where(eq(notificationChannel.workspaceId, orgId))
		.orderBy(desc(notificationChannel.createdAt));
});

export const saveNotificationChannel = createServerFn({ method: "POST" })
	.validator(
		(input: {
			id?: string;
			name: string;
			type: string;
			config: Record<string, unknown>;
			enabled?: boolean;
		}) => input,
	)
	.handler(async ({ data }) => {
		const { orgId } = await requireOrg();

		if (data.id) {
			await db
				.update(notificationChannel)
				.set({
					name: data.name,
					type: data.type,
					config: data.config,
					enabled: data.enabled ?? true,
				})
				.where(
					and(
						eq(notificationChannel.id, data.id),
						eq(notificationChannel.workspaceId, orgId),
					),
				);
			return { id: data.id };
		}

		const id = crypto.randomUUID();
		await db.insert(notificationChannel).values({
			id,
			workspaceId: orgId,
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
		const { orgId } = await requireOrg();

		await db
			.delete(notificationChannel)
			.where(
				and(
					eq(notificationChannel.id, data.channelId),
					eq(notificationChannel.workspaceId, orgId),
				),
			);
		return { success: true };
	});
