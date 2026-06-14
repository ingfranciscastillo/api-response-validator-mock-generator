import { createAuthClient } from 'better-auth/react'
import { organizationClient } from 'better-auth/organization'
import { env } from '#/env'

export const authClient = createAuthClient({
  baseURL: env.SERVER_URL ?? 'http://localhost:3000',
  trustedOrigins: env.BETTER_AUTH_TRUSTED_ORIGINS?.split(',').map(s => s.trim()) ?? [
    'http://localhost:3000',
    'http://localhost:5173',
  ],
  plugins: [
    organizationClient(),
  ],
})

export const { 
  useSession, 
  signIn, 
  signUp, 
  signOut, 
  getSession,
  revokeSession,
  revokeSessions,
} = authClient

export const { 
  useOrganization,
  useOrganizations,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  inviteMember,
  removeMember,
  updateMemberRole,
  acceptInvitation,
} = organizationClient(authClient)