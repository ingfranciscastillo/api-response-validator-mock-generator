# Architecture — API Response Validator & Mock Generator

## 1. Overview

A premium SaaS platform for validating API responses against OpenAPI/Swagger specifications, detecting contract drift and breaking changes, and generating realistic mock data. Built as a single full-stack TanStack Start application deployed on a serverless-friendly stack with Neon (serverless Postgres) as the database.

---

## 2. Tech Stack

### Core Framework
- **TanStack Start** — full-stack React framework (file-based routing, SSR, server functions)
- **TanStack Router** — type-safe routing (bundled with Start)
- **TanStack Query** — server state, caching, mutations
- **TanStack Table** — data tables (specs list, validation runs, mock library)
- **TypeScript** — strict mode across the entire codebase

### UI Layer
- **Tailwind CSS** — utility styling, configured per `design_system.md` tokens
- **shadcn/ui** — base component library (button, dialog, tabs, table, etc.)
- **lucide-react** — icon set
- **recharts** — dashboard analytics charts
- **@monaco-editor/react** — code/JSON/YAML editor for spec viewing & editing
- **react-json-view-lite** — collapsible JSON tree viewer for responses/mocks
- **next-themes** (or custom) — dark-mode-first theme management (dark is default and primary)

### Auth
- **Better Auth** — email/password + OAuth (GitHub, Google), session management, organization/team plugin for workspaces

### Database & ORM
- **Neon** — serverless Postgres (branching, autoscaling, HTTP/WebSocket driver)
- **Drizzle ORM** — schema definition, migrations, queries
- **drizzle-kit** — migration generation/management
- **drizzle-zod** — generate Zod schemas from Drizzle tables for validation
- **@neondatabase/serverless** — Neon driver (HTTP for edge/serverless functions, WebSocket pool for transactions)

### Validation Engine
- **@apidevtools/swagger-parser** — parse & dereference OpenAPI 2.0/3.0/3.1 specs
- **ajv** + **ajv-formats** — JSON Schema validation engine (core of the contract validator)
- **ajv-errors** — human-readable validation error messages

### Mock Generation
- **@faker-js/faker** — realistic fake data generation
- **json-schema-faker** — generate mock payloads from JSON Schema, wired to faker + ajv

### Diffing
- **microdiff** — lightweight deep diff for response-vs-schema and version comparisons
- Custom diff layer on top for OpenAPI-spec-to-spec comparison (breaking change detection)

### Background Jobs (Drift Detection)
- **Inngest** — serverless-friendly background jobs & cron (works well with serverless DB + serverless deploy targets; avoids need for Redis/BullMQ infrastructure)
  - Scheduled jobs poll monitored endpoints and run validation against stored specs
  - Triggers breaking-change alerts and drift records

### File/Blob Storage
- **Cloudflare R2** (S3-compatible) — storage for large spec files, generated mock datasets, exported reports
- Small specs (<~200KB) may be stored inline as JSONB in Neon; large ones reference an R2 object key

### Reports Export
- **Playwright** (server-side, run in a Node runtime) — render HTML report to PDF
- JSON export — direct serialization of validation run data

### Validation (forms & API)
- **Zod** — request/response validation for server functions and API routes, paired with `drizzle-zod`

### Deployment
- **Vercel** or **Netlify** (TanStack Start supports both) — primary deploy target
- **Neon** — database, with separate branches per environment (production, preview, development)
- **Cloudflare R2** — object storage
- **Inngest Cloud** — job orchestration

---

## 3. High-Level System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        TanStack Start App                        │
│                                                                     │
│  ┌───────────────┐   ┌────────────────┐   ┌────────────────────┐ │
│  │  Routes (UI)   │   │ Server Functions│   │   API Routes       │ │
│  │  - Landing     │◄──┤ - specs.*       │◄──┤ - /api/auth/*      │ │
│  │  - Dashboard   │   │ - validation.*  │   │ - /api/webhooks/*  │ │
│  │  - Specs       │   │ - mocks.*       │   │ - /api/public/*    │ │
│  │  - Validation  │   │ - reports.*     │   │   (mock serving)   │ │
│  │  - Mock Library│   │ - drift.*       │   └────────────────────┘ │
│  │  - Reports     │   └───────┬─────────┘                          │
│  │  - Settings    │           │                                    │
│  └────────────────┘           │                                    │
└────────────────────────────────┼──────────────────────────────────┘
                                   │
        ┌──────────────┬──────────┼──────────────┬────────────────┐
        ▼              ▼          ▼              ▼                ▼
  ┌──────────┐  ┌─────────────┐ ┌─────────┐ ┌───────────┐  ┌─────────────┐
  │  Neon    │  │ Cloudflare  │ │  Ajv +  │ │  Inngest  │  │ Better Auth │
  │ Postgres │  │     R2      │ │ JSF +   │ │  (drift   │  │  (sessions, │
  │ (Drizzle)│  │ (specs,     │ │ Faker   │ │  cron +   │  │   orgs,     │
  │          │  │  mocks,      │ │ engine  │ │  alerts)  │  │   OAuth)    │
  │          │  │  reports)    │ │         │ │           │  │             │
  └──────────┘  └─────────────┘ └─────────┘ └───────────┘  └─────────────┘
```

---

## 4. Project Structure

```
/
├── app/
│   ├── routes/
│   │   ├── __root.tsx
│   │   ├── index.tsx                      # Landing page
│   │   ├── (auth)/
│   │   │   ├── login.tsx
│   │   │   ├── register.tsx
│   │   │   └── reset-password.tsx
│   │   ├── (dashboard)/
│   │   │   ├── route.tsx                  # Dashboard layout (sidebar, topbar)
│   │   │   ├── dashboard/
│   │   │   │   └── index.tsx              # Overview
│   │   │   ├── specs/
│   │   │   │   ├── index.tsx              # Specifications list
│   │   │   │   ├── new.tsx                # Upload/paste spec
│   │   │   │   └── $specId/
│   │   │   │       ├── index.tsx          # Spec detail (endpoint explorer)
│   │   │   │       ├── endpoints.$endpointId.tsx
│   │   │   │       └── compare.tsx        # Version comparison
│   │   │   ├── validation/
│   │   │   │   ├── index.tsx              # Validation runs timeline
│   │   │   │   ├── workspace.tsx          # Interactive testing workspace
│   │   │   │   └── runs.$runId.tsx        # Run detail / diff view
│   │   │   ├── mocks/
│   │   │   │   ├── index.tsx              # Mock library
│   │   │   │   └── $mockId.tsx            # Mock preview/detail
│   │   │   ├── reports/
│   │   │   │   ├── index.tsx              # Reports list
│   │   │   │   └── $reportId.tsx          # Report viewer
│   │   │   ├── drift/
│   │   │   │   └── index.tsx              # Contract drift / breaking change alerts
│   │   │   ├── team/
│   │   │   │   ├── members.tsx
│   │   │   │   └── audit-log.tsx
│   │   │   └── settings/
│   │   │       ├── account.tsx
│   │   │       ├── workspace.tsx
│   │   │       └── api-keys.tsx
│   │   └── api/
│   │       ├── auth/$.ts                  # Better Auth handler
│   │       ├── webhooks/drift.ts          # Inngest webhook endpoint
│   │       └── public/mocks/$mockId.ts    # Public mock-serving endpoint
│   │
│   ├── server/
│   │   ├── db/
│   │   │   ├── schema/                    # Drizzle schema files (per domain)
│   │   │   │   ├── auth.ts
│   │   │   │   ├── workspaces.ts
│   │   │   │   ├── specs.ts
│   │   │   │   ├── endpoints.ts
│   │   │   │   ├── validation.ts
│   │   │   │   ├── mocks.ts
│   │   │   │   ├── reports.ts
│   │   │   │   ├── drift.ts
│   │   │   │   └── audit.ts
│   │   │   ├── client.ts                  # Neon + Drizzle client setup
│   │   │   └── index.ts                   # re-exports
│   │   │
│   │   ├── functions/                     # TanStack Start server functions
│   │   │   ├── specs.ts
│   │   │   ├── validation.ts
│   │   │   ├── mocks.ts
│   │   │   ├── reports.ts
│   │   │   ├── drift.ts
│   │   │   ├── workspaces.ts
│   │   │   └── audit.ts
│   │   │
│   │   ├── services/                      # Core business logic
│   │   │   ├── openapi/
│   │   │   │   ├── parser.ts              # swagger-parser wrapper
│   │   │   │   ├── dereference.ts
│   │   │   │   └── version-diff.ts        # spec-to-spec comparison
│   │   │   ├── validation/
│   │   │   │   ├── engine.ts              # ajv-based schema validation
│   │   │   │   ├── response-diff.ts       # microdiff-based diffing
│   │   │   │   └── rules.ts               # custom validation rules
│   │   │   ├── mocks/
│   │   │   │   ├── generator.ts           # json-schema-faker + faker
│   │   │   │   ├── variants.ts            # multi-variant / edge case / error mocks
│   │   │   │   └── custom-rules.ts
│   │   │   ├── reports/
│   │   │   │   ├── html-report.ts
│   │   │   │   ├── pdf-export.ts          # Playwright
│   │   │   │   └── json-export.ts
│   │   │   └── storage/
│   │   │       └── r2.ts                  # R2 client wrapper
│   │   │
│   │   ├── jobs/                          # Inngest functions
│   │   │   ├── client.ts
│   │   │   ├── drift-check.ts             # scheduled drift detection
│   │   │   └── breaking-change-alert.ts
│   │   │
│   │   └── auth/
│   │       ├── auth.ts                    # Better Auth config
│   │       └── permissions.ts             # role/permission helpers
│   │
│   ├── components/
│   │   ├── ui/                            # shadcn components (generated)
│   │   ├── layout/                        # sidebar, topbar, shell
│   │   ├── editors/                       # MonacoEditor wrappers, JSON viewer
│   │   ├── validation/                    # result cards, diff viewer, status badges
│   │   ├── specs/                         # schema tree, endpoint explorer
│   │   ├── mocks/                         # mock cards, variant selector
│   │   ├── charts/                        # recharts wrappers
│   │   └── shared/                        # upload zone, search, empty states
│   │
│   ├── lib/
│   │   ├── auth-client.ts                 # Better Auth client hooks
│   │   ├── query-client.ts                # TanStack Query setup
│   │   ├── utils.ts
│   │   └── constants.ts
│   │
│   └── styles/
│       └── globals.css                    # Tailwind + design tokens
│
├── drizzle/
│   ├── migrations/                        # generated SQL migrations
│   └── drizzle.config.ts
│
├── docs/                                   # planning docs (this set)
├── public/
├── .env.example
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── vite.config.ts
```

---

## 5. Environment Variables

```bash
# Database (Neon)
DATABASE_URL=postgres://...                # Neon pooled connection string
DATABASE_URL_UNPOOLED=postgres://...        # Direct connection (migrations)

# Better Auth
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Storage (Cloudflare R2)
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=

# Background Jobs
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=

# App
APP_URL=http://localhost:3000
NODE_ENV=development
```

---

## 6. Key Architectural Decisions

1. **Neon over self-hosted Postgres** — serverless scaling, branch-per-environment workflow (production/preview/dev branches), HTTP driver works well with serverless/edge deploy targets.
2. **Inngest over BullMQ/Redis** — avoids standing infrastructure for background jobs; integrates cleanly with serverless deploys and provides built-in retries/cron for drift detection.
3. **JSONB for spec/schema storage** — OpenAPI specs, dereferenced schemas, validation results, and mock payloads stored as JSONB columns in Neon for query flexibility; large blobs (>200KB) offloaded to R2 with a reference key stored in the row.
4. **Ajv + json-schema-faker pairing** — Ajv compiles schemas once and is reused both for validation and as the schema source for mock generation, ensuring mocks always match validation rules exactly.
5. **Server functions over REST-everywhere** — TanStack Start server functions handle internal app logic (type-safe, colocated); a small set of `/api/*` routes exist only for Better Auth, Inngest webhooks, and public mock-serving (external consumers).
6. **Workspace-scoped multitenancy** — every domain table is scoped by `workspace_id` (see `database.md`) using Better Auth's organization plugin as the source of truth for workspace membership.
