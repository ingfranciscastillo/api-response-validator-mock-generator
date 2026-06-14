import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { organization } from 'better-auth/plugins/organization'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { db } from '#/db'
import * as schema from '#/db/schema'
import { env } from '#/env'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
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

  socialProviders: {
    github: {
      clientId: env.GITHUB_CLIENT_ID ?? '',
      clientSecret: env.GITHUB_CLIENT_SECRET ?? '',
    },
    google: {
      clientId: env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: env.GOOGLE_CLIENT_SECRET ?? '',
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
      strategy: 'jwe',
    },
  },

  rateLimit: {
    enabled: true,
    window: 10,
    max: 100,
    customRules: {
      '/api/auth/sign-in/email': { window: 60, max: 5 },
      '/api/auth/sign-up/email': { window: 60, max: 3 },
      '/api/auth/forgot-password': { window: 60, max: 3 },
    },
  },

  trustedOrigins: env.BETTER_AUTH_TRUSTED_ORIGINS?.split(',').map(s => s.trim()) ?? [
    'http://localhost:3000',
    'http://localhost:5173',
  ],

  advanced: {
    useSecureCookies: process.env.NODE_ENV === 'production',
    cookiePrefix: 'api-validator',
    defaultCookieAttributes: {
      sameSite: 'lax',
      path: '/',
    },
    ipAddress: {
      ipAddressHeaders: ['x-forwarded-for', 'x-real-ip'],
      ipv6Subnet: 64,
    },
  },

  plugins: [
    organization({
      acceptMemberInviteOnSignUp: true,
      defaultRole: 'member',
      roles: ['owner', 'admin', 'member', 'viewer'],
    }),
    tanstackStartCookies(),
  ],

  databaseHooks: {
    user: {
      create: {
        after: async ({ data }) => {
          console.log(`[Auth] User created: ${data.id}`)
        },
      },
      update: {
        after: async ({ data, oldData }) => {
          if (oldData?.email !== data.email) {
            console.log(`[Auth] Email changed for user ${data.id}: ${oldData?.email} -> ${data.email}`)
          }
        },
      },
    },
    session: {
      create: {
        after: async ({ data, ctx }) => {
          const ip = ctx?.request?.headers.get('x-forwarded-for')
          const userAgent = ctx?.request?.headers.get('user-agent')
          console.log(`[Auth] Session created for user ${data.userId}`, { ip, userAgent })
        },
      },
      delete: {
        before: async ({ data }) => {
          console.log(`[Auth] Session deleted: ${data.id}`)
          return true
        },
      },
    },
    account: {
      create: {
        after: async ({ data }) => {
          console.log(`[Auth] Account linked: user ${data.userId} via ${data.providerId}`)
        },
      },
    },
  },
})

export type Auth = typeof auth