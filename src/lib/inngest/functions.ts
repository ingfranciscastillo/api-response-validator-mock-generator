import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
	driftAlert,
	driftCheck,
	notificationChannel,
	specificationVersion,
} from "@/db/schema";
import { compareSpecificationVersions } from "@/lib/specs/compare";
import { inngest } from "./client";

export const scheduledDriftCheck = inngest.createFunction(
	{ id: "scheduled-drift-check", name: "Scheduled Drift Check" },
	{ cron: "0 0 * * *" },
	async ({ step }) => {
		const enabledChecks = await step.run("fetch-enabled-checks", async () => {
			return db.select().from(driftCheck).where(eq(driftCheck.enabled, true));
		});

		for (const check of enabledChecks) {
			await step.run(`check-spec-${check.specId}`, async () => {
				const versions = await db
					.select()
					.from(specificationVersion)
					.where(eq(specificationVersion.specId, check.specId))
					.orderBy(desc(specificationVersion.version));

				if (versions.length < 2) return;

				const comparison = await compareSpecificationVersions(
					versions[1].id,
					versions[0].id,
				);
				const breakingChanges = comparison.changes.filter((c) => c.breaking);

				for (const change of breakingChanges) {
					await db.insert(driftAlert).values({
						id: crypto.randomUUID(),
						workspaceId: check.workspaceId,
						specId: check.specId,
						fromVersionId: versions[1].id,
						toVersionId: versions[0].id,
						type: "drift",
						severity: "medium",
						summary: change.description,
						changes: [change] as unknown as Record<string, unknown>[],
						status: "open",
					});
				}

				await db
					.update(driftCheck)
					.set({ lastRunAt: new Date() })
					.where(eq(driftCheck.id, check.id));
			});
		}

		return { checked: enabledChecks.length };
	},
);

export const breakingChangeAlert = inngest.createFunction(
	{ id: "breaking-change-alert", name: "Breaking Change Alert" },
	{ event: "drift/breaking-change-detected" },
	async ({ event, step }) => {
		const { specId, workspaceId, alertId } = event.data;

		const channels = await step.run("fetch-channels", async () => {
			return db
				.select()
				.from(notificationChannel)
				.where(
					and(
						eq(notificationChannel.workspaceId, workspaceId),
						eq(notificationChannel.enabled, true),
					),
				);
		});

		await step.run("dispatch-notifications", async () => {
			const alert = await db
				.select()
				.from(driftAlert)
				.where(eq(driftAlert.id, alertId))
				.then((r) => r[0]);

			if (!alert) return;

			const payload = {
				alertId: alert.id,
				specId,
				type: alert.type,
				severity: alert.severity,
				summary: alert.summary,
				detectedAt: alert.detectedAt.toISOString(),
			};

			for (const channel of channels) {
				const config = channel.config as Record<string, string>;
				try {
					if (channel.type === "webhook" && config.url) {
						await fetch(config.url, {
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({
								event: "breaking_change_detected",
								...payload,
							}),
						});
					} else if (channel.type === "email" && config.email) {
						console.log(
							`[email] To: ${config.email}, Subject: Breaking Change Alert - ${alert.summary}`,
							payload,
						);
					}
				} catch (e) {
					console.error(
						`Failed to dispatch to channel ${channel.id} (${channel.type}):`,
						e,
					);
				}
			}
		});

		return { dispatched: channels.length };
	},
);
