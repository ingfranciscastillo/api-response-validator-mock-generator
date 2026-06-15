import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { and, desc, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import {
	apiKey,
	organization,
	organizationInvitation,
	organizationMember,
	user,
} from "@/db/schema";
import { writeAuditLog } from "@/lib/audit/functions";
import { auth } from "@/lib/auth";
import { getUserRole, requireRole } from "@/lib/auth/permissions";

export const inviteMember = createServerFn({ method: "POST" })
	.validator(
		(input: { organizationId: string; email: string; role?: string }) => input,
	)
	.handler(async ({ data }) => {
		const headers = getRequestHeaders();
		const session = await auth.api.getSession({ headers });
		if (!session) throw new Error("Unauthorized");

		const role = await getUserRole(session.user.id, data.organizationId);
		requireRole(role, "admin");

		const id = crypto.randomUUID();
		await db.insert(organizationInvitation).values({
			id,
			organizationId: data.organizationId,
			email: data.email,
			role: (data.role ?? "member") as "owner" | "admin" | "member" | "viewer",
			expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
			status: "pending",
		});

		const ip = headers.get("x-forwarded-for") ?? undefined;
		await writeAuditLog({
			workspaceId: data.organizationId,
			actorId: session.user.id,
			action: "member.invited",
			entityType: "organization",
			entityId: data.organizationId,
			metadata: { email: data.email, role: data.role },
			ipAddress: ip,
		});

		return { id, email: data.email, role: data.role ?? "member" };
	});

export const listMembers = createServerFn({ method: "GET" })
	.validator((input: { organizationId: string }) => input)
	.handler(async ({ data }) => {
		const headers = getRequestHeaders();
		const session = await auth.api.getSession({ headers });
		if (!session) throw new Error("Unauthorized");

		const members = await db
			.select({
				id: organizationMember.id,
				userId: organizationMember.userId,
				role: organizationMember.role,
				createdAt: organizationMember.createdAt,
				name: user.name,
				email: user.email,
				image: user.image,
			})
			.from(organizationMember)
			.innerJoin(user, eq(organizationMember.userId, user.id))
			.where(eq(organizationMember.organizationId, data.organizationId))
			.orderBy(organizationMember.createdAt);

		return members;
	});

export const updateMemberRole = createServerFn({ method: "POST" })
	.validator(
		(input: { organizationId: string; memberId: string; role: string }) =>
			input,
	)
	.handler(async ({ data }) => {
		const headers = getRequestHeaders();
		const session = await auth.api.getSession({ headers });
		if (!session) throw new Error("Unauthorized");

		const role = await getUserRole(session.user.id, data.organizationId);
		requireRole(role, "owner");

		await db
			.update(organizationMember)
			.set({ role: data.role as "owner" | "admin" | "member" | "viewer" })
			.where(
				and(
					eq(organizationMember.id, data.memberId),
					ne(organizationMember.role, "owner"),
				),
			);

		const ip = headers.get("x-forwarded-for") ?? undefined;
		await writeAuditLog({
			workspaceId: data.organizationId,
			actorId: session.user.id,
			action: "member.role.updated",
			entityType: "organization",
			entityId: data.organizationId,
			metadata: { memberId: data.memberId, role: data.role },
			ipAddress: ip,
		});

		return { success: true };
	});

export const removeMember = createServerFn({ method: "POST" })
	.validator((input: { organizationId: string; memberId: string }) => input)
	.handler(async ({ data }) => {
		const headers = getRequestHeaders();
		const session = await auth.api.getSession({ headers });
		if (!session) throw new Error("Unauthorized");

		const role = await getUserRole(session.user.id, data.organizationId);
		requireRole(role, "admin");

		await db
			.delete(organizationMember)
			.where(
				and(
					eq(organizationMember.id, data.memberId),
					ne(organizationMember.role, "owner"),
				),
			);

		const ip = headers.get("x-forwarded-for") ?? undefined;
		await writeAuditLog({
			workspaceId: data.organizationId,
			actorId: session.user.id,
			action: "member.removed",
			entityType: "organization",
			entityId: data.organizationId,
			metadata: { memberId: data.memberId },
			ipAddress: ip,
		});

		return { success: true };
	});

export const updateWorkspace = createServerFn({ method: "POST" })
	.validator(
		(input: {
			organizationId: string;
			name?: string;
			slug?: string;
			logo?: string;
		}) => input,
	)
	.handler(async ({ data }) => {
		const headers = getRequestHeaders();
		const session = await auth.api.getSession({ headers });
		if (!session) throw new Error("Unauthorized");

		const role = await getUserRole(session.user.id, data.organizationId);
		requireRole(role, "admin");

		const updateData: Record<string, string> = {};
		if (data.name) updateData.name = data.name;
		if (data.slug) updateData.slug = data.slug;
		if (data.logo !== undefined) updateData.logo = data.logo;

		await db
			.update(organization)
			.set(updateData)
			.where(eq(organization.id, data.organizationId));

		const ip = headers.get("x-forwarded-for") ?? undefined;
		await writeAuditLog({
			workspaceId: data.organizationId,
			actorId: session.user.id,
			action: "workspace.updated",
			entityType: "organization",
			entityId: data.organizationId,
			metadata: updateData,
			ipAddress: ip,
		});

		return { success: true };
	});

export const createApiKey = createServerFn({ method: "POST" })
	.validator(
		(input: {
			workspaceId: string;
			name: string;
			scopes?: string[];
			expiresAt?: string;
		}) => input,
	)
	.handler(async ({ data }) => {
		const headers = getRequestHeaders();
		const session = await auth.api.getSession({ headers });
		if (!session) throw new Error("Unauthorized");

		const role = await getUserRole(session.user.id, data.workspaceId);
		requireRole(role, "admin");

		const rawKey = `arv_${crypto.randomUUID().replace(/-/g, "")}`;
		const keyHash = await globalThis.crypto.subtle
			.digest("SHA-256", new TextEncoder().encode(rawKey))
			.then((buf) => {
				const hashArray = Array.from(new Uint8Array(buf));
				return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
			});

		const id = crypto.randomUUID();
		await db.insert(apiKey).values({
			id,
			workspaceId: data.workspaceId,
			name: data.name,
			keyHash,
			keyPrefix: rawKey.slice(0, 8),
			scopes: JSON.stringify(data.scopes ?? []),
			expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
			createdBy: session.user.id,
		});

		const ip = headers.get("x-forwarded-for") ?? undefined;
		await writeAuditLog({
			workspaceId: data.workspaceId,
			actorId: session.user.id,
			action: "api_key.created",
			entityType: "api_key",
			entityId: id,
			metadata: { name: data.name },
			ipAddress: ip,
		});

		return { id, rawKey };
	});

export const listApiKeys = createServerFn({ method: "GET" })
	.validator((input: { workspaceId: string }) => input)
	.handler(async ({ data }) => {
		const headers = getRequestHeaders();
		const session = await auth.api.getSession({ headers });
		if (!session) throw new Error("Unauthorized");

		const role = await getUserRole(session.user.id, data.workspaceId);
		requireRole(role, "admin");

		const keys = await db
			.select({
				id: apiKey.id,
				name: apiKey.name,
				keyPrefix: apiKey.keyPrefix,
				scopes: apiKey.scopes,
				lastUsedAt: apiKey.lastUsedAt,
				expiresAt: apiKey.expiresAt,
				createdAt: apiKey.createdAt,
			})
			.from(apiKey)
			.where(eq(apiKey.workspaceId, data.workspaceId))
			.orderBy(desc(apiKey.createdAt));

		return keys.map((k) => ({
			id: k.id,
			name: k.name,
			keyPrefix: k.keyPrefix,
			scopes: (typeof k.scopes === "string"
				? JSON.parse(k.scopes)
				: k.scopes) as string[],
			lastUsedAt: k.lastUsedAt,
			expiresAt: k.expiresAt,
			createdAt: k.createdAt,
		}));
	});

export const revokeApiKey = createServerFn({ method: "POST" })
	.validator((input: { workspaceId: string; keyId: string }) => input)
	.handler(async ({ data }) => {
		const headers = getRequestHeaders();
		const session = await auth.api.getSession({ headers });
		if (!session) throw new Error("Unauthorized");

		const role = await getUserRole(session.user.id, data.workspaceId);
		requireRole(role, "admin");

		await db.delete(apiKey).where(eq(apiKey.id, data.keyId));

		const ip = headers.get("x-forwarded-for") ?? undefined;
		await writeAuditLog({
			workspaceId: data.workspaceId,
			actorId: session.user.id,
			action: "api_key.revoked",
			entityType: "api_key",
			entityId: data.keyId,
			ipAddress: ip,
		});

		return { success: true };
	});
