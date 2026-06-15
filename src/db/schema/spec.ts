import {
	index,
	integer,
	json,
	pgTable,
	text,
	timestamp,
} from "drizzle-orm/pg-core";
import { organization } from "./auth";

export const specification = pgTable(
	"specifications",
	{
		id: text("id").primaryKey(),
		name: text("name").notNull(),
		description: text("description"),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
	},
	(table) => [index("spec_org_idx").on(table.organizationId)],
);

export const specificationVersion = pgTable(
	"specification_versions",
	{
		id: text("id").primaryKey(),
		specId: text("spec_id")
			.notNull()
			.references(() => specification.id, { onDelete: "cascade" }),
		version: integer("version").notNull(),
		openapiSpec: json("openapi_spec").notNull(),
		summary: json("summary"),
		createdAt: timestamp("created_at").notNull().defaultNow(),
	},
	(table) => [index("spec_version_spec_idx").on(table.specId)],
);

export const endpoint = pgTable(
	"endpoints",
	{
		id: text("id").primaryKey(),
		specId: text("spec_id")
			.notNull()
			.references(() => specification.id, { onDelete: "cascade" }),
		specVersionId: text("spec_version_id")
			.notNull()
			.references(() => specificationVersion.id, { onDelete: "cascade" }),
		method: text("method").notNull(),
		path: text("path").notNull(),
		summary: text("summary"),
		operationId: text("operation_id"),
		parameters: json("parameters"),
		requestBody: json("request_body"),
		responses: json("responses").notNull(),
		serverUrl: text("server_url"),
		createdAt: timestamp("created_at").notNull().defaultNow(),
	},
	(table) => [
		index("endpoint_spec_idx").on(table.specId),
		index("endpoint_version_idx").on(table.specVersionId),
	],
);
