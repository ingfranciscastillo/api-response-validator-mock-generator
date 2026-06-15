import { index, json, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { organization, user } from "./auth";
import { validationRun } from "./validation";

export const report = pgTable(
	"reports",
	{
		id: text("id").primaryKey(),
		workspaceId: text("workspace_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		description: text("description"),
		type: text("type").notNull().default("validation-summary"),
		runId: text("run_id").references(() => validationRun.id, {
			onDelete: "set null",
		}),
		config: json("config"),
		data: json("data").notNull(),
		status: text("status").notNull().default("ready"),
		generatedBy: text("generated_by").references(() => user.id, {
			onDelete: "set null",
		}),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
	},
	(table) => [
		index("report_workspace_idx").on(table.workspaceId, table.createdAt),
		index("report_type_idx").on(table.workspaceId, table.type),
	],
);

export type Report = typeof report.$inferSelect;
export type NewReport = typeof report.$inferInsert;
