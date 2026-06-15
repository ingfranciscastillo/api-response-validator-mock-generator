import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { driftAlert, driftCheck, specificationVersion } from "@/db/schema";
import { writeAuditLog } from "@/lib/audit/functions";
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

		const alert = await db
			.select()
			.from(driftAlert)
			.where(eq(driftAlert.id, data.alertId))
			.then((r) => r[0] ?? null);

		if (!alert) throw new Error("Alert not found");

		await db
			.update(driftAlert)
			.set({
				status: "resolved",
				resolvedAt: new Date(),
				resolvedBy: session.user.id,
			})
			.where(eq(driftAlert.id, data.alertId));

		const ip = headers.get("x-forwarded-for") ?? undefined;
		await writeAuditLog({
			workspaceId: alert.workspaceId,
			actorId: session.user.id,
			action: "drift.alert.resolved",
			entityType: "drift_alert",
			entityId: data.alertId,
			metadata: { specId: alert.specId, severity: alert.severity },
			ipAddress: ip,
		});

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

export const getDriftChecks = createServerFn({ method: "GET" })
	.validator((input: { organizationId: string }) => input)
	.handler(async ({ data }) => {
		const headers = getRequestHeaders();
		const session = await auth.api.getSession({ headers });
		if (!session) throw new Error("Unauthorized");

		return db
			.select()
			.from(driftCheck)
			.where(eq(driftCheck.workspaceId, data.organizationId))
			.orderBy(desc(driftCheck.createdAt));
	});

export const createDriftCheck = createServerFn({ method: "POST" })
	.validator(
		(input: { organizationId: string; specId: string; schedule?: string }) =>
			input,
	)
	.handler(async ({ data }) => {
		const headers = getRequestHeaders();
		const session = await auth.api.getSession({ headers });
		if (!session) throw new Error("Unauthorized");

		const existing = await db
			.select()
			.from(driftCheck)
			.where(
				and(
					eq(driftCheck.workspaceId, data.organizationId),
					eq(driftCheck.specId, data.specId),
				),
			)
			.then((r) => r[0] ?? null);

		if (existing) {
			return existing;
		}

		const id = crypto.randomUUID();
		await db.insert(driftCheck).values({
			id,
			workspaceId: data.organizationId,
			specId: data.specId,
			schedule: data.schedule ?? "0 0 * * *",
			enabled: true,
		});

		await writeAuditLog({
			workspaceId: data.organizationId,
			actorId: session.user.id,
			action: "drift.check.created",
			entityType: "drift_check",
			entityId: id,
			metadata: { specId: data.specId },
			ipAddress: headers.get("x-forwarded-for") ?? undefined,
		});

		return { id };
	});

export const updateDriftCheck = createServerFn({ method: "POST" })
	.validator(
		(input: { checkId: string; enabled?: boolean; schedule?: string }) => input,
	)
	.handler(async ({ data }) => {
		const headers = getRequestHeaders();
		const session = await auth.api.getSession({ headers });
		if (!session) throw new Error("Unauthorized");

		const updates: Record<string, unknown> = {};
		if (data.enabled !== undefined) updates.enabled = data.enabled;
		if (data.schedule !== undefined) updates.schedule = data.schedule;

		await db
			.update(driftCheck)
			.set(updates as Partial<typeof driftCheck.$inferInsert>)
			.where(eq(driftCheck.id, data.checkId));

		await writeAuditLog({
			workspaceId: "",
			actorId: session.user.id,
			action: "drift.check.updated",
			entityType: "drift_check",
			entityId: data.checkId,
			metadata: updates,
			ipAddress: headers.get("x-forwarded-for") ?? undefined,
		});

		return { success: true };
	});

export const deleteDriftCheck = createServerFn({ method: "POST" })
	.validator((input: { checkId: string }) => input)
	.handler(async ({ data }) => {
		const headers = getRequestHeaders();
		const session = await auth.api.getSession({ headers });
		if (!session) throw new Error("Unauthorized");

		const check = await db
			.select()
			.from(driftCheck)
			.where(eq(driftCheck.id, data.checkId))
			.then((r) => r[0] ?? null);

		if (!check) throw new Error("Drift check not found");

		await db.delete(driftCheck).where(eq(driftCheck.id, data.checkId));

		await writeAuditLog({
			workspaceId: check.workspaceId,
			actorId: session.user.id,
			action: "drift.check.deleted",
			entityType: "drift_check",
			entityId: data.checkId,
			metadata: { specId: check.specId },
			ipAddress: headers.get("x-forwarded-for") ?? undefined,
		});

		return { success: true };
	});
