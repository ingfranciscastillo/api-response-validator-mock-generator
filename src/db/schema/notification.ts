import {
	boolean,
	index,
	json,
	pgTable,
	text,
	timestamp,
} from "drizzle-orm/pg-core";
import { organization } from "./auth";

export const notificationChannel = pgTable(
	"notification_channels",
	{
		id: text("id").primaryKey(),
		workspaceId: text("workspace_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		type: text("type").notNull(),
		config: json("config").notNull(),
		enabled: boolean("enabled").notNull().default(true),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
	},
	(table) => [
		index("notification_channel_workspace_idx").on(table.workspaceId),
	],
);

export type NotificationChannel = typeof notificationChannel.$inferSelect;
