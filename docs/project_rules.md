# Project Rules — API Response Validator & Mock Generator

This file is the entry point for any AI agent (Claude Code) working on this repository. Read this first, then consult the referenced docs as needed for the task at hand.

---

## 1. Reference Documents

All planning docs live in `/docs`. Read the relevant ones before starting work:

| Doc | Read before... |
|---|---|
| `architecture.md` | Any new file/module, deciding where code goes, choosing a library |
| `design_system.md` | Any UI/component/styling work |
| `database.md` | Any schema change, migration, or new query |
| `features_spec.md` | Implementing business logic (validation, mocks, diff, drift, comparison) |
| `api_spec.md` | Implementing or calling a server function/route |
| `pages_and_flows.md` | Building a page, route, or navigation flow |
| `components.md` | Building or reusing a UI component |
| `auth_and_permissions.md` | Any server function (role checks), workspace scoping |
| `roadmap.md` | Deciding what to build next / scope of current phase |
| `coding_standards.md` | Writing or editing any code |
| `acceptance_criteria.md` | Verifying a feature is "done" |

**Do not start implementing a feature without reading the corresponding spec section.** If a spec is ambiguous or silent on something needed, make the smallest reasonable decision consistent with neighboring patterns, note the assumption in the PR/commit description, and proceed — don't block on it.

---

## 2. Source of Truth & Drift

- `/docs` is the source of truth for product behavior, schema, and design tokens.
- If implementation reveals that a doc is wrong, outdated, or impractical: **update the doc in the same change** that diverges from it. Never let code and docs silently disagree.
- Never invent new top-level domain tables, server function modules, or routes that aren't in `database.md` / `api_spec.md` / `pages_and_flows.md` without first adding them there.

---

## 3. Commands

```bash
# Install dependencies
pnpm install

# Dev server
pnpm dev

# Type check
pnpm typecheck

# Lint
pnpm lint
pnpm lint:fix

# Format
pnpm format

# Tests
pnpm test
pnpm test:watch
pnpm test:e2e

# Database (Drizzle + Neon)
pnpm db:generate     # generate migration from schema changes
pnpm db:migrate      # apply migrations
pnpm db:push         # push schema directly (dev only, never on shared branches)
pnpm db:studio       # open Drizzle Studio
pnpm db:seed         # seed sample workspace + Petstore-like spec

# Build
pnpm build
pnpm start
```

Adjust this section if the actual `package.json` scripts differ — keep it in sync.

---

## 4. Environment & Secrets

- Required env vars are listed in `architecture.md` §5 and mirrored in `.env.example`.
- Never commit `.env`, real API keys, OAuth secrets, or Neon connection strings.
- Use the **Neon dev branch** connection string for local development; never run destructive migrations against a `production` branch without explicit instruction.
- When adding a new env var, update `.env.example` and `architecture.md` §5 in the same change.

---

## 5. Database & Migrations

- Schema lives in `app/server/db/schema/*.ts`, organized per `database.md` §11 file mapping.
- Every schema change → run `pnpm db:generate` to produce a migration file. **Never hand-edit generated SQL migrations** unless fixing a generation bug.
- Every table must be scoped by `workspace_id` (except the auth tables themselves) per `database.md` and `auth_and_permissions.md` §7.
- Do not use `db:push` against any shared/staging/production Neon branch — only for local iteration.
- Add Drizzle relations (`relations()`) for every foreign key so query joins via `db.query.*` work.
- Pair every table with `drizzle-zod` `insert`/`select` schemas, exported from the same schema file.

---

## 6. Auth & Permissions

- Every server function that reads/writes workspace data must:
  1. Resolve session → user
  2. Resolve active `workspaceId`
  3. Check role via the shared `requireRole(...)` helper per `auth_and_permissions.md` §6
- Never bypass workspace scoping with a raw query missing a `workspace_id` filter.
- New permission-sensitive actions must be added to the permission matrix in `auth_and_permissions.md` §4 in the same change.

---

## 7. UI & Design System Discipline

- No hardcoded colors, font sizes, spacing, or radii — use the CSS variables / Tailwind tokens defined in `design_system.md`.
- Dark theme is the default (`.dark` on `<html>`). Light theme is secondary; don't break it, but don't prioritize it over dark.
- Reuse existing components from `components.md` before creating new ones. If a new reusable component is needed, add it to `components.md` in the same change.
- Use `lucide-react` for icons, `JetBrains Mono` for technical/code content, `Inter` for UI copy — no other font families.
- Avoid introducing new animation/UI libraries beyond what's listed in `architecture.md` without strong justification.

---

## 8. Adding Dependencies

- Before adding a new package, check `architecture.md` §2 — if an equivalent is already chosen, use it.
- If a genuinely new dependency is needed:
  1. Add it to `architecture.md` §2 with a one-line justification
  2. Prefer well-maintained, typed packages
  3. Avoid heavy frameworks that duplicate TanStack Start/Query/Table/Router functionality

---

## 9. Background Jobs (Inngest)

- Drift detection and notification dispatch run via Inngest (`app/server/jobs/`).
- Don't add new background-processing infrastructure (queues, Redis, cron libraries) — extend Inngest functions.
- Every new scheduled/event-driven job must be registered in `app/server/jobs/client.ts` and documented in `features_spec.md`.

---

## 10. File Storage (R2)

- Inline JSONB for payloads under ~200KB; anything larger goes to R2 with the `storage_key` convention: `workspaces/{workspaceId}/{domain}/{entityId}/{filename}`.
- Never store unencrypted credentials (e.g., test environment auth tokens) in plain JSONB — encrypt at rest or store as references to a secrets mechanism.

---

## 11. Git & Commit Conventions

- Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`, `style:`
- One logical change per commit where practical (e.g., schema + migration + server function + UI for a single feature can be one commit if small, or split if large)
- If a commit changes a `/docs` file because implementation diverged, mention it explicitly: `feat: add mock latency override (docs: update database.md mock_serve_config)`

---

## 12. Testing Expectations

- Unit tests for: validation engine (`services/validation/engine.ts`), diff engine, mock generation (`services/mocks/generator.ts`), version comparison logic — these contain the most business logic and edge cases (see `acceptance_criteria.md`)
- Server functions: integration tests against a test Neon branch or local Postgres-compatible test DB
- E2E (Playwright): critical flows only — sign up → create workspace → upload spec → run validation → generate mock → view dashboard
- Don't aim for 100% coverage on UI components; prioritize logic-heavy modules

---

## 13. Performance & Scope Discipline

- Follow `roadmap.md` phase order. Don't jump ahead to Phase 5 (drift/Inngest) features while Phase 1–2 (specs/validation) is incomplete.
- All list views must be paginated server-side from the start (per `api_spec.md` `PaginatedResult<T>`) — don't ship unpaginated lists "temporarily."
- Don't prematurely optimize; follow the architecture as specified, and flag (don't silently fix) any perceived architectural issue for discussion.

---

## 14. What NOT To Do

- Don't modify files under `/mnt/skills`, `/mnt/user-data/uploads`, or other read-only paths.
- Don't introduce a second ORM, a second auth library, or a second component library.
- Don't create new top-level routes outside the structure in `pages_and_flows.md` without updating that doc.
- Don't silently drop workspace scoping "for simplicity" — security/isolation is non-negotiable per `auth_and_permissions.md`.
- Don't reformat/rewrite unrelated files as part of an unrelated change.
