import { createServerFn } from "@tanstack/react-start";
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
import { requireOrg } from "@/lib/auth/org";
import { getUserRole, requireRole } from "@/lib/auth/permissions";

export const inviteMember = createServerFn({ method: "POST" })
	.validator((input: { email: string; role?: string }) => input)
	.handler(async ({ data }) => {
		const { orgId, userId, ipAddress } = await requireOrg();

		const role = await getUserRole(userId, orgId);
		requireRole(role, "admin");

		const id = crypto.randomUUID();
		await db.insert(organizationInvitation).values({
			id,
			organizationId: orgId,
			email: data.email,
			role: (data.role ?? "member") as "owner" | "admin" | "member" | "viewer",
			expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
			status: "pending",
		});

		await writeAuditLog({
			workspaceId: orgId,
			actorId: userId,
			action: "member.invited",
			entityType: "organization",
			entityId: orgId,
			metadata: { email: data.email, role: data.role },
			ipAddress,
		});

		return { id, email: data.email, role: data.role ?? "member" };
	});

export const listMembers = createServerFn({ method: "GET" }).handler(
	async () => {
		const { orgId } = await requireOrg();

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
			.where(eq(organizationMember.organizationId, orgId))
			.orderBy(organizationMember.createdAt);

		return members;
	},
);

export const updateMemberRole = createServerFn({ method: "POST" })
	.validator((input: { memberId: string; role: string }) => input)
	.handler(async ({ data }) => {
		const { orgId, userId, ipAddress } = await requireOrg();

		const role = await getUserRole(userId, orgId);
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

		await writeAuditLog({
			workspaceId: orgId,
			actorId: userId,
			action: "member.role.updated",
			entityType: "organization",
			entityId: orgId,
			metadata: { memberId: data.memberId, role: data.role },
			ipAddress,
		});

		return { success: true };
	});

export const removeMember = createServerFn({ method: "POST" })
	.validator((input: { memberId: string }) => input)
	.handler(async ({ data }) => {
		const { orgId, userId, ipAddress } = await requireOrg();

		const role = await getUserRole(userId, orgId);
		requireRole(role, "admin");

		await db
			.delete(organizationMember)
			.where(
				and(
					eq(organizationMember.id, data.memberId),
					ne(organizationMember.role, "owner"),
				),
			);

		await writeAuditLog({
			workspaceId: orgId,
			actorId: userId,
			action: "member.removed",
			entityType: "organization",
			entityId: orgId,
			metadata: { memberId: data.memberId },
			ipAddress,
		});

		return { success: true };
	});

export const updateWorkspace = createServerFn({ method: "POST" })
	.validator((input: { name?: string; slug?: string; logo?: string }) => input)
	.handler(async ({ data }) => {
		const { orgId, userId, ipAddress } = await requireOrg();

		const role = await getUserRole(userId, orgId);
		requireRole(role, "admin");

		const updateData: Record<string, string> = {};
		if (data.name) updateData.name = data.name;
		if (data.slug) updateData.slug = data.slug;
		if (data.logo !== undefined) updateData.logo = data.logo;

		await db
			.update(organization)
			.set(updateData)
			.where(eq(organization.id, orgId));

		await writeAuditLog({
			workspaceId: orgId,
			actorId: userId,
			action: "workspace.updated",
			entityType: "organization",
			entityId: orgId,
			metadata: updateData,
			ipAddress,
		});

		return { success: true };
	});

export const createApiKey = createServerFn({ method: "POST" })
	.validator(
		(input: { name: string; scopes?: string[]; expiresAt?: string }) => input,
	)
	.handler(async ({ data }) => {
		const { orgId, userId, ipAddress } = await requireOrg();

		const role = await getUserRole(userId, orgId);
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
			workspaceId: orgId,
			name: data.name,
			keyHash,
			keyPrefix: rawKey.slice(0, 8),
			scopes: JSON.stringify(data.scopes ?? []),
			expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
			createdBy: userId,
		});

		await writeAuditLog({
			workspaceId: orgId,
			actorId: userId,
			action: "api_key.created",
			entityType: "api_key",
			entityId: id,
			metadata: { name: data.name },
			ipAddress,
		});

		return { id, rawKey };
	});

export const listApiKeys = createServerFn({ method: "GET" }).handler(
	async () => {
		const { orgId, userId, ipAddress } = await requireOrg();

		const role = await getUserRole(userId, orgId);
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
			.where(eq(apiKey.workspaceId, orgId))
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
	},
);

export const deleteWorkspace = createServerFn({ method: "POST" })
	.validator((input: { workspaceId: string }) => input)
	.handler(async ({ data }) => {
		const { orgId, userId } = await requireOrg();

		const role = await getUserRole(userId, orgId);
		requireRole(role, "owner");

		if (data.workspaceId !== orgId) {
			throw new Error("Workspace ID mismatch");
		}

		await writeAuditLog({
			workspaceId: orgId,
			actorId: userId,
			action: "workspace.deleted",
			entityType: "organization",
			entityId: orgId,
		});

		await db.delete(organization).where(eq(organization.id, orgId));

		return { success: true };
	});

export const revokeApiKey = createServerFn({ method: "POST" })
	.validator((input: { keyId: string }) => input)
	.handler(async ({ data }) => {
		const { orgId, userId, ipAddress } = await requireOrg();

		const role = await getUserRole(userId, orgId);
		requireRole(role, "admin");

		await db.delete(apiKey).where(eq(apiKey.id, data.keyId));

		await writeAuditLog({
			workspaceId: orgId,
			actorId: userId,
			action: "api_key.revoked",
			entityType: "api_key",
			entityId: data.keyId,
			ipAddress,
		});

		return { success: true };
	});
