import {
	boolean,
	index,
	json,
	pgTable,
	text,
	timestamp,
} from "drizzle-orm/pg-core";
import { organization, user } from "./auth";
import { specification, specificationVersion } from "./spec";

export const driftCheck = pgTable(
	"drift_checks",
	{
		id: text("id").primaryKey(),
		workspaceId: text("workspace_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		specId: text("spec_id")
			.notNull()
			.references(() => specification.id, { onDelete: "cascade" }),
		schedule: text("schedule").notNull().default("0 0 * * *"),
		enabled: boolean("enabled").notNull().default(true),
		lastRunAt: timestamp("last_run_at"),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
	},
	(table) => [
		index("drift_check_workspace_idx").on(table.workspaceId),
		index("drift_check_spec_idx").on(table.specId),
	],
);

export const driftAlert = pgTable(
	"drift_alerts",
	{
		id: text("id").primaryKey(),
		workspaceId: text("workspace_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		specId: text("spec_id")
			.notNull()
			.references(() => specification.id, { onDelete: "cascade" }),
		fromVersionId: text("from_version_id").references(
			() => specificationVersion.id,
			{ onDelete: "set null" },
		),
		toVersionId: text("to_version_id").references(
			() => specificationVersion.id,
			{ onDelete: "set null" },
		),
		type: text("type").notNull(),
		severity: text("severity").notNull().default("medium"),
		summary: text("summary").notNull(),
		changes: json("changes"),
		status: text("status").notNull().default("open"),
		detectedAt: timestamp("detected_at").notNull().defaultNow(),
		resolvedAt: timestamp("resolved_at"),
		resolvedBy: text("resolved_by").references(() => user.id, {
			onDelete: "set null",
		}),
	},
	(table) => [
		index("drift_alert_workspace_idx").on(table.workspaceId, table.status),
		index("drift_alert_spec_idx").on(table.specId, table.detectedAt),
	],
);

export type DriftCheck = typeof driftCheck.$inferSelect;
export type DriftAlert = typeof driftAlert.$inferSelect;
