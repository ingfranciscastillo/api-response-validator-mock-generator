import { organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
	baseURL: import.meta.env.VITE_BETTER_AUTH_URL ?? "http://localhost:3000",
	plugins: [organizationClient()],
});

export const {
	useSession,
	signIn,
	signUp,
	signOut,
	getSession,
	revokeSession,
	revokeSessions,
} = authClient;

export const organization = authClient.organization;
