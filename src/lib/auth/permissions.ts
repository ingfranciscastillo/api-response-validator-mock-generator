import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { organizationMember } from "@/db/schema";

const roleHierarchy: Record<string, number> = {
	owner: 4,
	admin: 3,
	member: 2,
	viewer: 1,
};

export function meetsRole(userRole: string, requiredRole: string): boolean {
	return (roleHierarchy[userRole] ?? 0) >= (roleHierarchy[requiredRole] ?? 0);
}

export async function getUserRole(
	userId: string,
	workspaceId: string,
): Promise<string | null> {
	const member = await db
		.select({ role: organizationMember.role })
		.from(organizationMember)
		.where(
			and(
				eq(organizationMember.organizationId, workspaceId),
				eq(organizationMember.userId, userId),
			),
		)
		.then((r) => r[0] ?? null);

	return member?.role ?? null;
}

export function requireRole(
	userRole: string | null,
	requiredRole: string,
): void {
	if (!userRole) throw new Error("Unauthorized");
	if (!meetsRole(userRole, requiredRole)) {
		throw new Error("Insufficient permissions");
	}
}
