export * from "./schema/auth";
export {
	account,
	organization,
	organizationInvitation,
	organizationMember,
	session,
	user,
	verification,
} from "./schema/auth";

import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const todos = pgTable("todos", {
	id: serial().primaryKey(),
	title: text().notNull(),
	createdAt: timestamp("created_at").defaultNow(),
});
