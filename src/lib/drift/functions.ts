import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { driftAlert, specificationVersion } from "@/db/schema";
import { auth } from "@/lib/auth";
import { compareSpecificationVersions } from "@/lib/specs/compare";

export const getDriftAlerts = createServerFn({ method: "GET" })
	.validator((input: { organizationId: string; status?: string }) => input)
	.handler(async ({ data }) => {
		const headers = getRequestHeaders();
		const session = await auth.api.getSession({ headers });
		if (!session) throw new Error("Unauthorized");

		const filters = [eq(driftAlert.workspaceId, data.organizationId)];
		if (data.status) filters.push(eq(driftAlert.status, data.status));

		return db
			.select()
			.from(driftAlert)
			.where(and(...filters))
			.orderBy(desc(driftAlert.detectedAt));
	});

export const resolveDriftAlert = createServerFn({ method: "POST" })
	.validator((input: { alertId: string }) => input)
	.handler(async ({ data }) => {
		const headers = getRequestHeaders();
		const session = await auth.api.getSession({ headers });
		if (!session) throw new Error("Unauthorized");

		await db
			.update(driftAlert)
			.set({
				status: "resolved",
				resolvedAt: new Date(),
				resolvedBy: session.user.id,
			})
			.where(eq(driftAlert.id, data.alertId));

		return { success: true };
	});

export const checkSpecForDrift = createServerFn({ method: "POST" })
	.validator((input: { specId: string; organizationId: string }) => input)
	.handler(async ({ data }) => {
		const headers = getRequestHeaders();
		const session = await auth.api.getSession({ headers });
		if (!session) throw new Error("Unauthorized");

		const versions = await db
			.select()
			.from(specificationVersion)
			.where(eq(specificationVersion.specId, data.specId))
			.orderBy(desc(specificationVersion.version));

		if (versions.length < 2) {
			return { alerts: 0, message: "Need at least 2 versions to compare" };
		}

		const latest = versions[0];
		const previous = versions[1];

		const comparison = await compareSpecificationVersions(
			previous.id,
			latest.id,
		);

		let alertsCreated = 0;
		for (const change of comparison.changes.filter((c) => c.breaking)) {
			const id = crypto.randomUUID();
			await db.insert(driftAlert).values({
				id,
				workspaceId: data.organizationId,
				specId: data.specId,
				fromVersionId: previous.id,
				toVersionId: latest.id,
				type: "breaking",
				severity: "high",
				summary: change.description,
				changes: [change] as unknown as Record<string, unknown>[],
				status: "open",
			});
			alertsCreated++;
		}

		return {
			alerts: alertsCreated,
			message: `${alertsCreated} breaking change(s) detected`,
		};
	});
