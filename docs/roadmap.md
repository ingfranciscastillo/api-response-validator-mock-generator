# Roadmap — API Response Validator & Mock Generator

Phased plan so Claude Code builds incrementally instead of attempting everything at once. Each phase should be functional end-to-end before moving to the next.

---

## Phase 0 — Project Setup

- Initialize TanStack Start project (TypeScript, Vite)
- Configure Tailwind + shadcn/ui with `design_system.md` tokens (colors, fonts, radii, shadows) wired into `tailwind.config.ts` and `globals.css`
- Set up Neon project + Drizzle config (`drizzle.config.ts`), connect via `@neondatabase/serverless`
- Set up Better Auth (email/password + GitHub/Google OAuth) with organization plugin
- Implement base auth schema migration (`user`, `session`, `account`, `organization`, `member`, `invitation`)
- Create base layout: `AppSidebar`, `AppTopbar`, `(dashboard)` route layout
- Implement login/register/reset-password pages

**Done when:** a user can sign up, create a workspace, log in, and see an empty dashboard shell.

---

## Phase 1 — Specifications Core

- Implement `specification`, `specification_version`, `endpoint` schema + migrations
- Build OpenAPI ingestion pipeline: parse, dereference (`@apidevtools/swagger-parser`), extract endpoints, store
- Implement `/specs/new` (upload, paste, URL import) and `/specs` list
- Implement `/specs/:specId` detail with `EndpointExplorer` and `SchemaTreeViewer`
- Implement `/specs/:specId/endpoints/:endpointId` detail (request/response schema panels)

**Done when:** a user can upload an OpenAPI spec and browse all its endpoints with full schema detail.

---

## Phase 2 — Validation Engine

- Implement `validation_run`, `validation_result` schema + migrations
- Build Ajv-based validation engine (`services/validation/engine.ts`) with violation extraction
- Build response diff engine (`microdiff`)
- Implement `/validation/workspace` (API Testing Workspace): request builder, server-side fetch, response viewer, inline validation results
- Implement `runValidation`, `validateResponse`, `sendTestRequest` server functions
- Implement `/validation` timeline and `/validation/runs/:runId` detail with `ValidationResultCard`, `ViolationsList`, `DiffViewer`

**Done when:** a user can send a real request to an endpoint, see it validated against the spec with violations and diffs, and save it as a validation run.

---

## Phase 3 — Mock Generation

- Implement `mock_dataset`, `mock_serve_config` schema + migrations
- Build mock generation engine (`json-schema-faker` + `@faker-js/faker`, field-name heuristics, custom rules, seeding)
- Implement `generateMock`, `generateMockVariants`, `generateEdgeCaseMocks`, `generateErrorMocks`
- Implement `/mocks` library and `/mocks/:mockId` detail with `MockCard`, `MockGenerationModal`, `GenerationRulesEditor`
- Implement public mock-serving endpoint (`/api/public/mocks/:mockId`) with `api_key` auth

**Done when:** a user can generate realistic mocks (including edge cases and errors) for any endpoint and serve them via a public URL.

---

## Phase 4 — Dashboard & Reporting

- Implement `getDashboardOverview`/`getDashboardCharts` aggregations
- Build `/dashboard` overview with `StatCard`, `TrendLineChart`, `ViolationsBarChart`, recent runs table
- Implement `report` schema + migration
- Build report generation: HTML template, Playwright PDF export, JSON export, R2 storage
- Implement `/reports` list and `/reports/:reportId` viewer

**Done when:** the dashboard reflects real workspace data, and users can generate/download validation summary reports.

---

## Phase 5 — Drift Detection & Breaking Changes

- Implement `drift_check`, `drift_alert`, `notification_channel` schema + migrations
- Set up Inngest, build scheduled `drift-check` job + `breaking-change-alert` dispatch
- Implement `/drift` page with alerts table, severity summary, notification channel config
- Implement spec-to-spec version comparison (`compareSpecificationVersions`) and `/specs/:specId/compare`

**Done when:** monitored specs automatically detect drift on schedule, raise alerts, and notify configured channels; users can compare spec versions and see breaking-change risk.

---

## Phase 6 — Team Collaboration & Polish

- Implement `comment`, `audit_log` schema + migrations; wire audit logging into all mutating server functions
- Implement `/team/members`, `/team/audit-log`
- Implement comments UI across spec/run/result/mock/alert detail pages
- Implement `/settings/account`, `/settings/workspace`, `/settings/api-keys`
- Build `CommandPalette` (Cmd+K global search)

**Done when:** teams can collaborate via comments, manage members/roles, view audit history, and manage API keys.

---

## Phase 7 — Landing Page & Final Polish

- Build full landing page (`pages_and_flows.md` §2): hero with `HeroVisualization`, feature grid, deep dives, dashboard preview, advanced features strip, CTA, footer
- Pass over all pages for design-system consistency, empty states, loading skeletons, responsive breakpoints
- Performance pass: pagination on all list views, query caching via TanStack Query, image/asset optimization

**Done when:** the product looks and feels like a polished, premium SaaS ready for demo/launch.

---

## Suggested Working Order Notes for Claude Code

- Each phase should include its Drizzle migration before any UI work depending on it
- Reuse `StatusBadge`, `MethodBadge`, `JsonViewer`, `SchemaTreeViewer` early (Phase 1–2) since they're used pervasively
- Seed scripts (sample workspace, sample OpenAPI spec like Petstore) are useful from Phase 1 onward for development/testing
- Defer Inngest setup until Phase 5 — earlier phases can use synchronous server functions for validation/mock generation
