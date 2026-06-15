import {
	boolean,
	index,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";

export const user = pgTable(
	"users",
	{
		id: text("id").primaryKey(),
		name: text("name").notNull(),
		email: text("email").notNull().unique(),
		emailVerified: boolean("email_verified").notNull().default(false),
		image: text("image"),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
	},
	(table) => [uniqueIndex("users_email_idx").on(table.email)],
);

export const session = pgTable(
	"sessions",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		expiresAt: timestamp("expires_at").notNull(),
		token: text("token").notNull().unique(),
		ipAddress: text("ip_address"),
		userAgent: text("user_agent"),
		activeOrganizationId: text("active_organization_id").references(
			() => organization.id,
			{ onDelete: "set null" },
		),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
	},
	(table) => [
		index("sessions_user_id_idx").on(table.userId),
		index("sessions_token_idx").on(table.token),
	],
);

export const account = pgTable(
	"accounts",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		accountId: text("account_id").notNull(),
		providerId: text("provider_id").notNull(),
		accessToken: text("access_token"),
		refreshToken: text("refresh_token"),
		expiresAt: timestamp("expires_at"),
		scope: text("scope"),
		password: text("password"),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
	},
	(table) => [
		index("accounts_user_id_idx").on(table.userId),
		uniqueIndex("accounts_provider_account_idx").on(
			table.providerId,
			table.accountId,
		),
	],
);

export const verification = pgTable(
	"verifications",
	{
		id: text("id").primaryKey(),
		identifier: text("identifier").notNull(),
		value: text("value").notNull(),
		expiresAt: timestamp("expires_at").notNull(),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
	},
	(table) => [index("verifications_identifier_idx").on(table.identifier)],
);

export const organizationRoleEnum = pgEnum("organization_role", [
	"owner",
	"admin",
	"member",
	"viewer",
]);

export const organization = pgTable(
	"organizations",
	{
		id: text("id").primaryKey(),
		name: text("name").notNull(),
		slug: text("slug").notNull().unique(),
		logo: text("logo"),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
	},
	(table) => [uniqueIndex("organizations_slug_idx").on(table.slug)],
);

export const organizationMember = pgTable(
	"organization_members",
	{
		id: text("id").primaryKey(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		role: organizationRoleEnum("role").notNull().default("member"),
		createdAt: timestamp("created_at").notNull().defaultNow(),
	},
	(table) => [
		index("org_members_org_id_idx").on(table.organizationId),
		index("org_members_user_id_idx").on(table.userId),
		uniqueIndex("org_members_org_user_idx").on(
			table.organizationId,
			table.userId,
		),
	],
);

export const organizationInvitation = pgTable(
	"organization_invitations",
	{
		id: text("id").primaryKey(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		email: text("email").notNull(),
		role: organizationRoleEnum("role").notNull().default("member"),
		status: text("status").notNull().default("pending"),
		expiresAt: timestamp("expires_at").notNull(),
		createdAt: timestamp("created_at").notNull().defaultNow(),
	},
	(table) => [
		index("org_invites_org_id_idx").on(table.organizationId),
		index("org_invites_email_idx").on(table.email),
	],
);

export type User = typeof user.$inferSelect;
export type Session = typeof session.$inferSelect;
export type Account = typeof account.$inferSelect;
export type Organization = typeof organization.$inferSelect;
export type OrganizationMember = typeof organizationMember.$inferSelect;
export type OrganizationInvitation = typeof organizationInvitation.$inferSelect;
