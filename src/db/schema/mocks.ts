import {
	boolean,
	index,
	integer,
	json,
	pgTable,
	text,
	timestamp,
} from "drizzle-orm/pg-core";
import { organization, user } from "./auth";
import { endpoint, specification } from "./spec";

export const mockDataset = pgTable(
	"mock_datasets",
	{
		id: text("id").primaryKey(),
		workspaceId: text("workspace_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		specificationId: text("specification_id")
			.notNull()
			.references(() => specification.id, { onDelete: "cascade" }),
		endpointId: text("endpoint_id")
			.notNull()
			.references(() => endpoint.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		statusCode: integer("status_code").notNull(),
		variantType: text("variant_type").notNull(),
		variantLabel: text("variant_label"),
		payload: json("payload"),
		storageKey: text("storage_key"),
		generationRules: json("generation_rules"),
		seed: text("seed"),
		tags: json("tags"),
		isPinned: boolean("is_pinned").notNull().default(false),
		createdBy: text("created_by").references(() => user.id, {
			onDelete: "set null",
		}),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
		deletedAt: timestamp("deleted_at"),
	},
	(table) => [
		index("mock_dataset_workspace_created_idx").on(
			table.workspaceId,
			table.createdAt,
		),
		index("mock_dataset_endpoint_status_idx").on(
			table.endpointId,
			table.statusCode,
		),
		index("mock_dataset_spec_idx").on(table.specificationId),
	],
);

export const mockServeConfig = pgTable(
	"mock_serve_configs",
	{
		id: text("id").primaryKey(),
		workspaceId: text("workspace_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		mockDatasetId: text("mock_dataset_id")
			.notNull()
			.unique()
			.references(() => mockDataset.id, { onDelete: "cascade" }),
		isEnabled: boolean("is_enabled").notNull().default(true),
		latencyMs: integer("latency_ms").notNull().default(0),
		responseHeadersOverride: json("response_headers_override"),
		createdAt: timestamp("created_at").notNull().defaultNow(),
	},
	(table) => [index("mock_serve_config_workspace_idx").on(table.workspaceId)],
);
