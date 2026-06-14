import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins/organization";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { db } from "#/db";
import * as schema from "#/db/schema";
import { env } from "#/env";

const socialProviders: Record<
	string,
	{ clientId: string; clientSecret: string }
> = {};

if (env.GITHUB_CLIENT_ID) {
	if (!env.GITHUB_CLIENT_SECRET) {
		throw new Error(
			"GITHUB_CLIENT_SECRET is required when GITHUB_CLIENT_ID is set",
		);
	}
	socialProviders.github = {
		clientId: env.GITHUB_CLIENT_ID,
		clientSecret: env.GITHUB_CLIENT_SECRET,
	};
}

if (env.GOOGLE_CLIENT_ID) {
	if (!env.GOOGLE_CLIENT_SECRET) {
		throw new Error(
			"GOOGLE_CLIENT_SECRET is required when GOOGLE_CLIENT_ID is set",
		);
	}
	socialProviders.google = {
		clientId: env.GOOGLE_CLIENT_ID,
		clientSecret: env.GOOGLE_CLIENT_SECRET,
	};
}

export const auth = betterAuth({
	baseURL: env.BETTER_AUTH_URL,
	database: drizzleAdapter(db, {
		provider: "pg",
		schema: {
			user: schema.user,
			session: schema.session,
			account: schema.account,
			verification: schema.verification,
		},
	}),

	emailAndPassword: {
		enabled: true,
		requireEmailVerification: false,
	},

	socialProviders,

	session: {
		expiresIn: 60 * 60 * 24 * 7,
		updateAge: 60 * 60 * 24,
		cookieCache: {
			enabled: true,
			maxAge: 60 * 5,
			strategy: "jwe",
		},
	},

	account: {
		encryptOAuthTokens: true,
	},

	rateLimit: {
		enabled: true,
		window: 10,
		max: 100,
		storage: "database",
		customRules: {
			"/api/auth/sign-in/email": { window: 60, max: 5 },
			"/api/auth/sign-up/email": { window: 60, max: 3 },
			"/api/auth/forgot-password": { window: 60, max: 3 },
		},
	},

	trustedOrigins: env.BETTER_AUTH_TRUSTED_ORIGINS?.split(",").map((s) =>
		s.trim(),
	) ?? ["http://localhost:3000", "http://localhost:5173"],

	advanced: {
		useSecureCookies: process.env.NODE_ENV === "production",
		cookiePrefix: "api-validator",
		defaultCookieAttributes: {
			sameSite: "lax",
			path: "/",
		},
		ipAddress: {
			ipAddressHeaders: ["x-forwarded-for", "x-real-ip"],
			ipv6Subnet: 64,
		},
		backgroundTasks: {
			handler: (promise: Promise<unknown>) => {
				const waitUntil = (
					globalThis as unknown as { waitUntil?: (p: Promise<unknown>) => void }
				).waitUntil;
				if (typeof waitUntil === "function") {
					waitUntil(promise);
				}
			},
		},
	},

	plugins: [organization(), tanstackStartCookies()],

	databaseHooks: {
		user: {
			create: {
				after: async (user) => {
					console.log(`[Auth] User created: ${user.id}`);
				},
			},
			update: {
				after: async (user) => {
					console.log(`[Auth] User updated: ${user.id}`);
				},
			},
		},
		session: {
			create: {
				after: async (session, ctx) => {
					const ip = ctx?.request?.headers.get("x-forwarded-for");
					const userAgent = ctx?.request?.headers.get("user-agent");
					console.log(`[Auth] Session created for user ${session.userId}`, {
						ip,
						userAgent,
					});
				},
			},
			delete: {
				before: async (session) => {
					console.log(`[Auth] Session deleted: ${session.id}`);
				},
			},
		},
		account: {
			create: {
				after: async (account) => {
					console.log(
						`[Auth] Account linked: user ${account.userId} via ${account.providerId}`,
					);
				},
			},
		},
	},
});

export type Auth = typeof auth;
