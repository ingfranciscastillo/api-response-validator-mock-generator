import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { and, desc, eq, gt, ne } from "drizzle-orm";
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
import { requireOrg } from "@/lib/auth/org";
import { getUserRole, requireRole } from "@/lib/auth/permissions";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function assertValidRole(
	role: string,
): asserts role is "owner" | "admin" | "member" | "viewer" {
	if (!["owner", "admin", "member", "viewer"].includes(role)) {
		throw new Error(`Invalid role: ${role}`);
	}
}

export const inviteMember = createServerFn({ method: "POST" })
	.validator((input: { email: string; role?: string }) => input)
	.handler(async ({ data }) => {
		const { orgId, userId, ipAddress } = await requireOrg();

		const role = await getUserRole(userId, orgId);
		requireRole(role, "admin");

		if (!emailRegex.test(data.email)) {
			throw new Error("Invalid email format");
		}

		const existingMember = await db
			.select({ id: organizationMember.id })
			.from(organizationMember)
			.innerJoin(user, eq(organizationMember.userId, user.id))
			.where(
				and(
					eq(organizationMember.organizationId, orgId),
					eq(user.email, data.email),
				),
			)
			.then((r) => r[0] ?? null);

		if (existingMember) {
			throw new Error("User is already a member of this workspace");
		}

		const existingInvite = await db
			.select({ id: organizationInvitation.id })
			.from(organizationInvitation)
			.where(
				and(
					eq(organizationInvitation.organizationId, orgId),
					eq(organizationInvitation.email, data.email),
					eq(organizationInvitation.status, "pending"),
					gt(organizationInvitation.expiresAt, new Date()),
				),
			)
			.then((r) => r[0] ?? null);

		if (existingInvite) {
			throw new Error("A pending invitation already exists for this email");
		}

		const inviteRole = data.role ?? "member";
		assertValidRole(inviteRole);

		const id = crypto.randomUUID();
		await db.insert(organizationInvitation).values({
			id,
			organizationId: orgId,
			email: data.email,
			role: inviteRole,
			expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
			status: "pending",
		});

		await writeAuditLog({
			workspaceId: orgId,
			actorId: userId,
			action: "member.invited",
			entityType: "organization",
			entityId: orgId,
			metadata: { email: data.email, role: inviteRole },
			ipAddress,
		});

		return { id, email: data.email, role: inviteRole };
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

		const member = await db
			.select({ role: organizationMember.role })
			.from(organizationMember)
			.where(eq(organizationMember.id, data.memberId))
			.then((r) => r[0] ?? null);

		if (!member) throw new Error("Member not found");
		if (member.role === "owner") throw new Error("Cannot modify owner's role");

		await db
			.update(organizationMember)
			.set({ role: data.role as "owner" | "admin" | "member" | "viewer" })
			.where(eq(organizationMember.id, data.memberId));

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

		const member = await db
			.select({ role: organizationMember.role })
			.from(organizationMember)
			.where(eq(organizationMember.id, data.memberId))
			.then((r) => r[0] ?? null);

		if (!member) throw new Error("Member not found");
		if (member.role === "owner") throw new Error("Cannot remove owner");

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

export const listMyInvitations = createServerFn({ method: "GET" }).handler(
	async () => {
		const { orgId } = await requireOrg();

		const invitations = await db
			.select({
				id: organizationInvitation.id,
				email: organizationInvitation.email,
				role: organizationInvitation.role,
				status: organizationInvitation.status,
				expiresAt: organizationInvitation.expiresAt,
				createdAt: organizationInvitation.createdAt,
			})
			.from(organizationInvitation)
			.where(
				and(
					eq(organizationInvitation.organizationId, orgId),
					eq(organizationInvitation.status, "pending"),
				),
			)
			.orderBy(desc(organizationInvitation.createdAt));

		return invitations;
	},
);

export const listPendingInvitationsByEmail = createServerFn({
	method: "GET",
}).handler(async () => {
	const headers = getRequestHeaders();
	const session = await auth.api.getSession({ headers });
	if (!session) throw new Error("Unauthorized");

	const invitations = await db
		.select({
			id: organizationInvitation.id,
			organizationId: organizationInvitation.organizationId,
			organizationName: organization.name,
			email: organizationInvitation.email,
			role: organizationInvitation.role,
			status: organizationInvitation.status,
			expiresAt: organizationInvitation.expiresAt,
			createdAt: organizationInvitation.createdAt,
		})
		.from(organizationInvitation)
		.innerJoin(
			organization,
			eq(organizationInvitation.organizationId, organization.id),
		)
		.where(
			and(
				eq(organizationInvitation.email, session.user.email),
				eq(organizationInvitation.status, "pending"),
			),
		)
		.orderBy(desc(organizationInvitation.createdAt));

	return invitations;
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
		const { orgId, userId } = await requireOrg();

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
