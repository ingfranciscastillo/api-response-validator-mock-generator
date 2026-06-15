import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { driftAlert, driftCheck, specificationVersion } from "@/db/schema";
import { writeAuditLog } from "@/lib/audit/functions";
import { requireOrg } from "@/lib/auth/org";
import { compareSpecificationVersions } from "@/lib/specs/compare";

export const getDriftAlerts = createServerFn({ method: "GET" })
	.validator((input: { status?: string }) => input)
	.handler(async ({ data }) => {
		const { orgId } = await requireOrg();

		const filters = [eq(driftAlert.workspaceId, orgId)];
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
		const { orgId, userId, ipAddress } = await requireOrg();

		const alert = await db
			.select()
			.from(driftAlert)
			.where(
				and(eq(driftAlert.id, data.alertId), eq(driftAlert.workspaceId, orgId)),
			)
			.then((r) => r[0] ?? null);

		if (!alert) throw new Error("Alert not found");

		await db
			.update(driftAlert)
			.set({
				status: "resolved",
				resolvedAt: new Date(),
				resolvedBy: userId,
			})
			.where(eq(driftAlert.id, data.alertId));

		await writeAuditLog({
			workspaceId: alert.workspaceId,
			actorId: userId,
			action: "drift.alert.resolved",
			entityType: "drift_alert",
			entityId: data.alertId,
			metadata: { specId: alert.specId, severity: alert.severity },
			ipAddress,
		});

		return { success: true };
	});

export const checkSpecForDrift = createServerFn({ method: "POST" })
	.validator((input: { specId: string }) => input)
	.handler(async ({ data }) => {
		const { orgId } = await requireOrg();

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
				workspaceId: orgId,
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

export const getDriftChecks = createServerFn({ method: "GET" }).handler(
	async () => {
		const { orgId } = await requireOrg();

		return db
			.select()
			.from(driftCheck)
			.where(eq(driftCheck.workspaceId, orgId))
			.orderBy(desc(driftCheck.createdAt));
	},
);

export const createDriftCheck = createServerFn({ method: "POST" })
	.validator((input: { specId: string; schedule?: string }) => input)
	.handler(async ({ data }) => {
		const { orgId, userId, ipAddress } = await requireOrg();

		const existing = await db
			.select()
			.from(driftCheck)
			.where(
				and(
					eq(driftCheck.workspaceId, orgId),
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
			workspaceId: orgId,
			specId: data.specId,
			schedule: data.schedule ?? "0 0 * * *",
			enabled: true,
		});

		await writeAuditLog({
			workspaceId: orgId,
			actorId: userId,
			action: "drift.check.created",
			entityType: "drift_check",
			entityId: id,
			metadata: { specId: data.specId },
			ipAddress,
		});

		return { id };
	});

export const updateDriftCheck = createServerFn({ method: "POST" })
	.validator(
		(input: { checkId: string; enabled?: boolean; schedule?: string }) => input,
	)
	.handler(async ({ data }) => {
		const { orgId, userId, ipAddress } = await requireOrg();

		const updates: Record<string, unknown> = {};
		if (data.enabled !== undefined) updates.enabled = data.enabled;
		if (data.schedule !== undefined) updates.schedule = data.schedule;

		await db
			.update(driftCheck)
			.set(updates as Partial<typeof driftCheck.$inferInsert>)
			.where(
				and(eq(driftCheck.id, data.checkId), eq(driftCheck.workspaceId, orgId)),
			);

		await writeAuditLog({
			workspaceId: orgId,
			actorId: userId,
			action: "drift.check.updated",
			entityType: "drift_check",
			entityId: data.checkId,
			metadata: updates,
			ipAddress,
		});

		return { success: true };
	});

export const deleteDriftCheck = createServerFn({ method: "POST" })
	.validator((input: { checkId: string }) => input)
	.handler(async ({ data }) => {
		const { orgId, userId, ipAddress } = await requireOrg();

		const check = await db
			.select()
			.from(driftCheck)
			.where(
				and(eq(driftCheck.id, data.checkId), eq(driftCheck.workspaceId, orgId)),
			)
			.then((r) => r[0] ?? null);

		if (!check) throw new Error("Drift check not found");

		await db.delete(driftCheck).where(eq(driftCheck.id, data.checkId));

		await writeAuditLog({
			workspaceId: check.workspaceId,
			actorId: userId,
			action: "drift.check.deleted",
			entityType: "drift_check",
			entityId: data.checkId,
			metadata: { specId: check.specId },
			ipAddress,
		});

		return { success: true };
	});
