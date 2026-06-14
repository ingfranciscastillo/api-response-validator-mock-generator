import {
	index,
	integer,
	json,
	pgTable,
	text,
	timestamp,
} from "drizzle-orm/pg-core";
import { organization, user } from "./auth";
import { endpoint, specification } from "./spec";

export const validationRun = pgTable(
	"validation_runs",
	{
		id: text("id").primaryKey(),
		workspaceId: text("workspace_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		specificationId: text("specification_id").references(
			() => specification.id,
			{ onDelete: "set null" },
		),
		name: text("name"),
		triggerType: text("trigger_type").notNull(),
		status: text("status").notNull(),
		totalChecks: integer("total_checks").notNull().default(0),
		passedChecks: integer("passed_checks").notNull().default(0),
		warningChecks: integer("warning_checks").notNull().default(0),
		failedChecks: integer("failed_checks").notNull().default(0),
		startedAt: timestamp("started_at").notNull().defaultNow(),
		completedAt: timestamp("completed_at"),
		createdBy: text("created_by").references(() => user.id, {
			onDelete: "set null",
		}),
		createdAt: timestamp("created_at").notNull().defaultNow(),
	},
	(table) => [
		index("validation_run_workspace_created_idx").on(
			table.workspaceId,
			table.createdAt,
		),
		index("validation_run_spec_idx").on(table.specificationId, table.createdAt),
		index("validation_run_workspace_status_idx").on(
			table.workspaceId,
			table.status,
		),
	],
);

export const validationResult = pgTable(
	"validation_results",
	{
		id: text("id").primaryKey(),
		runId: text("run_id")
			.notNull()
			.references(() => validationRun.id, { onDelete: "cascade" }),
		endpointId: text("endpoint_id").references(() => endpoint.id, {
			onDelete: "set null",
		}),
		workspaceId: text("workspace_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		requestSnapshot: json("request_snapshot"),
		responseStatusCode: integer("response_status_code").notNull(),
		responseHeaders: json("response_headers"),
		responseBody: json("response_body"),
		expectedSchema: json("expected_schema"),
		outcome: text("outcome").notNull(),
		violations: json("violations"),
		diff: json("diff"),
		latencyMs: integer("latency_ms"),
		createdAt: timestamp("created_at").notNull().defaultNow(),
	},
	(table) => [
		index("validation_result_run_idx").on(table.runId),
		index("validation_result_endpoint_idx").on(
			table.endpointId,
			table.createdAt,
		),
		index("validation_result_workspace_outcome_idx").on(
			table.workspaceId,
			table.outcome,
		),
	],
);
