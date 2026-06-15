import { index, json, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { organization, user } from "./auth";

export const comment = pgTable(
	"comments",
	{
		id: text("id").primaryKey(),
		workspaceId: text("workspace_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		authorId: text("author_id").references(() => user.id, {
			onDelete: "set null",
		}),
		entityType: text("entity_type").notNull(),
		entityId: text("entity_id").notNull(),
		body: text("body").notNull(),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
		deletedAt: timestamp("deleted_at"),
	},
	(table) => [
		index("comment_workspace_idx").on(table.workspaceId),
		index("comment_entity_idx").on(table.entityType, table.entityId),
		index("comment_author_idx").on(table.authorId),
	],
);

export const auditLog = pgTable(
	"audit_logs",
	{
		id: text("id").primaryKey(),
		workspaceId: text("workspace_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		actorId: text("actor_id").references(() => user.id, {
			onDelete: "set null",
		}),
		action: text("action").notNull(),
		entityType: text("entity_type"),
		entityId: text("entity_id"),
		metadata: json("metadata"),
		ipAddress: text("ip_address"),
		createdAt: timestamp("created_at").notNull().defaultNow(),
	},
	(table) => [
		index("audit_log_workspace_idx").on(table.workspaceId, table.createdAt),
		index("audit_log_actor_idx").on(table.actorId),
		index("audit_log_entity_idx").on(table.entityType, table.entityId),
		index("audit_log_action_idx").on(table.action),
	],
);

export const apiKey = pgTable(
	"api_keys",
	{
		id: text("id").primaryKey(),
		workspaceId: text("workspace_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		keyHash: text("key_hash").notNull(),
		keyPrefix: text("key_prefix").notNull(),
		scopes: json("scopes").notNull().default([]),
		lastUsedAt: timestamp("last_used_at"),
		expiresAt: timestamp("expires_at"),
		createdBy: text("created_by").references(() => user.id, {
			onDelete: "set null",
		}),
		createdAt: timestamp("created_at").notNull().defaultNow(),
	},
	(table) => [index("api_key_workspace_idx").on(table.workspaceId)],
);

export type Comment = typeof comment.$inferSelect;
export type AuditLog = typeof auditLog.$inferSelect;
export type ApiKey = typeof apiKey.$inferSelect;
