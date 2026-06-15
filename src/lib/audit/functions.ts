import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { auditLog, comment, user } from "@/db/schema";
import { auth } from "@/lib/auth";
import { getUserRole, requireRole } from "@/lib/auth/permissions";

export async function writeAuditLog(input: {
	workspaceId: string;
	actorId: string | null;
	action: string;
	entityType?: string;
	entityId?: string;
	metadata?: Record<string, unknown>;
	ipAddress?: string;
}) {
	await db.insert(auditLog).values({
		id: crypto.randomUUID(),
		workspaceId: input.workspaceId,
		actorId: input.actorId,
		action: input.action,
		entityType: input.entityType ?? null,
		entityId: input.entityId ?? null,
		metadata: (input.metadata ?? null) as Record<string, unknown> | null,
		ipAddress: input.ipAddress ?? null,
	});
}

export const listComments = createServerFn({ method: "GET" })
	.validator((input: { entityType: string; entityId: string }) => input)
	.handler(async ({ data }) => {
		const headers = getRequestHeaders();
		const session = await auth.api.getSession({ headers });
		if (!session) throw new Error("Unauthorized");

		const rows = await db
			.select({
				id: comment.id,
				workspaceId: comment.workspaceId,
				authorId: comment.authorId,
				entityType: comment.entityType,
				entityId: comment.entityId,
				body: comment.body,
				createdAt: comment.createdAt,
				updatedAt: comment.updatedAt,
				authorName: user.name,
				authorImage: user.image,
			})
			.from(comment)
			.leftJoin(user, eq(comment.authorId, user.id))
			.where(
				and(
					eq(comment.entityType, data.entityType),
					eq(comment.entityId, data.entityId),
					eq(comment.deletedAt, null),
				),
			)
			.orderBy(desc(comment.createdAt));

		return rows.map((r) => ({
			...r,
			authorName: r.authorName ?? "Unknown",
			authorImage: r.authorImage ?? null,
		}));
	});

export const createComment = createServerFn({ method: "POST" })
	.validator(
		(input: {
			workspaceId: string;
			entityType: string;
			entityId: string;
			body: string;
		}) => input,
	)
	.handler(async ({ data }) => {
		const headers = getRequestHeaders();
		const session = await auth.api.getSession({ headers });
		if (!session) throw new Error("Unauthorized");

		const id = crypto.randomUUID();
		await db.insert(comment).values({
			id,
			workspaceId: data.workspaceId,
			authorId: session.user.id,
			entityType: data.entityType,
			entityId: data.entityId,
			body: data.body,
		});

		const ip = headers.get("x-forwarded-for") ?? undefined;
		await writeAuditLog({
			workspaceId: data.workspaceId,
			actorId: session.user.id,
			action: "comment.created",
			entityType: data.entityType,
			entityId: data.entityId,
			metadata: { commentId: id },
			ipAddress: ip,
		});

		return { id };
	});

export const deleteComment = createServerFn({ method: "POST" })
	.validator((input: { commentId: string; workspaceId: string }) => input)
	.handler(async ({ data }) => {
		const headers = getRequestHeaders();
		const session = await auth.api.getSession({ headers });
		if (!session) throw new Error("Unauthorized");

		const existing = await db
			.select()
			.from(comment)
			.where(eq(comment.id, data.commentId))
			.then((r) => r[0] ?? null);

		if (!existing) throw new Error("Comment not found");
		if (existing.deletedAt) throw new Error("Comment already deleted");

		const isAuthor = existing.authorId === session.user.id;
		if (!isAuthor) {
			const role = await getUserRole(session.user.id, data.workspaceId);
			requireRole(role, "admin");
		}

		await db
			.update(comment)
			.set({ deletedAt: new Date() })
			.where(eq(comment.id, data.commentId));

		const ip = headers.get("x-forwarded-for") ?? undefined;
		await writeAuditLog({
			workspaceId: data.workspaceId,
			actorId: session.user.id,
			action: "comment.deleted",
			entityType: existing.entityType,
			entityId: existing.entityId,
			metadata: { commentId: data.commentId },
			ipAddress: ip,
		});

		return { success: true };
	});

export const listAuditLog = createServerFn({ method: "GET" })
	.validator(
		(input: {
			workspaceId: string;
			entityType?: string;
			entityId?: string;
			actorId?: string;
			action?: string;
			dateFrom?: string;
			dateTo?: string;
			page?: number;
			pageSize?: number;
		}) => input,
	)
	.handler(async ({ data }) => {
		const headers = getRequestHeaders();
		const session = await auth.api.getSession({ headers });
		if (!session) throw new Error("Unauthorized");

		const role = await getUserRole(session.user.id, data.workspaceId);
		requireRole(role, "admin");

		const filters = [eq(auditLog.workspaceId, data.workspaceId)];

		if (data.entityType) filters.push(eq(auditLog.entityType, data.entityType));
		if (data.entityId) filters.push(eq(auditLog.entityId, data.entityId));
		if (data.actorId) filters.push(eq(auditLog.actorId, data.actorId));
		if (data.action) filters.push(eq(auditLog.action, data.action));
		if (data.dateFrom)
			filters.push(gte(auditLog.createdAt, new Date(data.dateFrom)));
		if (data.dateTo)
			filters.push(lte(auditLog.createdAt, new Date(data.dateTo)));

		const page = data.page ?? 1;
		const pageSize = data.pageSize ?? 50;
		const offset = (page - 1) * pageSize;

		const rows = await db
			.select()
			.from(auditLog)
			.where(and(...filters))
			.orderBy(desc(auditLog.createdAt))
			.limit(pageSize)
			.offset(offset);

		const total = await db
			.select({ count: auditLog.id })
			.from(auditLog)
			.where(and(...filters))
			.then((r) => r.length);

		return {
			rows,
			total,
			page,
			pageSize,
			totalPages: Math.ceil(total / pageSize),
		};
	});
