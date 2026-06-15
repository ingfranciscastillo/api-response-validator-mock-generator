import { getRequestHeaders } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { organizationMember } from "@/db/schema";
import { auth } from "@/lib/auth";

export type OrgSession = {
	orgId: string;
	userId: string;
	ipAddress: string | undefined;
};

export async function requireOrg(): Promise<OrgSession> {
	const headers = getRequestHeaders();
	const session = await auth.api.getSession({ headers });
	if (!session) throw new Error("Unauthorized");

	let orgId = session.session.activeOrganizationId as string | undefined;

	if (!orgId) {
		const membership = await db
			.select({ organizationId: organizationMember.organizationId })
			.from(organizationMember)
			.where(eq(organizationMember.userId, session.user.id))
			.then((r) => r[0] ?? null);

		if (!membership) throw new Error("No organization found");
		orgId = membership.organizationId;
	}

	return {
		orgId,
		userId: session.user.id,
		ipAddress: headers.get("x-forwarded-for") ?? undefined,
	};
}
