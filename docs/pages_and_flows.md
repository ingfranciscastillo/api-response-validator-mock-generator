# Pages & Flows — API Response Validator & Mock Generator

Maps every screen to its route, purpose, key components, and primary user flows.

---

## 1. Site Map

```
/                              Landing page (public)
/login                         Sign in
/register                      Sign up
/reset-password                Password reset

/dashboard                     Overview (default after login)
/specs                         Specifications list
/specs/new                     Upload/paste/import a spec
/specs/:specId                 Spec detail (endpoint explorer)
/specs/:specId/endpoints/:id   Endpoint detail
/specs/:specId/compare         Version comparison

/validation                    Validation runs timeline
/validation/workspace          API Testing Workspace
/validation/runs/:runId         Run detail / diff view

/mocks                         Mock library
/mocks/:mockId                 Mock detail/preview

/reports                       Reports list
/reports/:reportId             Report viewer

/drift                         Drift & breaking change alerts

/team/members                  Team members & invitations
/team/audit-log                Audit log

/settings/account              User account settings
/settings/workspace            Workspace settings
/settings/api-keys             API key management
```

---

## 2. Landing Page (`/`)

**Purpose:** Convert visitors (developers, eng leads) into sign-ups by demonstrating the product's value visually and concisely.

### Sections
1. **Hero**
   - Headline: "Validate API Responses. Generate Perfect Mocks. Ship With Confidence."
   - Supporting paragraph
   - Primary CTA: "Start Validating APIs" → `/register`
   - Secondary CTA: "View Demo" → opens interactive demo modal or scrolls to visualization
   - Interactive visualization (glass panel): animated flow showing Spec → Response → Validation Engine → Mock Output → Pass/Fail badges

2. **Logos/Trust bar** (optional) — "Trusted by teams at..." placeholder row

3. **Core Features Grid** (3-column cards)
   - Schema Validation
   - Automated Mock Generation
   - Difference Detection
   - Each card: icon, title, short description, "Learn more" link (anchors to feature detail sections below)

4. **Feature Deep Dives** (alternating image/visual + text sections)
   - Schema Validation — visual: schema tree + validation result card with violations
   - Mock Generation — visual: mock library card grid with variant badges
   - Difference Detection — visual: diff viewer showing added/removed/changed
   - API Testing Workspace — visual: request builder + response panel
   - Reporting — visual: report summary card with charts

5. **Dashboard Preview** — large glass-panel screenshot/mock of the dashboard overview, demonstrating "premium SaaS" feel

6. **Advanced Features Strip** (icon + short text, 4-column)
   - Contract Drift Detection
   - Breaking Change Alerts
   - Version Comparison
   - Team Collaboration

7. **Final CTA Section**
   - Gradient background panel
   - Headline: "Ship APIs your team can trust"
   - CTA: "Start Validating APIs"

8. **Footer**
   - Product links, docs (placeholder), legal, social

### Flow
- Unauthenticated user → `/register` or `/login` via CTAs
- "View Demo" → modal with read-only interactive preview (no auth required) using seeded sample data

---

## 3. Auth Pages

### `/login`
- Email/password fields, OAuth buttons (GitHub, Google)
- "Forgot password?" → `/reset-password`
- Link to `/register`

### `/register`
- Name, email, password fields, OAuth buttons
- On success: if no workspace exists, prompt to create one (inline step or redirect to onboarding modal) → then `/dashboard`

### `/reset-password`
- Email input → sends reset link
- Token-based reset form (via query param)

### Post-login Redirect Logic
- If user has zero workspaces → show "Create your workspace" modal (name + slug) before entering `/dashboard`
- If user has one workspace → enter directly
- If user has multiple → use last-active workspace (stored in session/local preference), switchable via topbar

---

## 4. Dashboard Layout (Shell)

Applies to all `/dashboard`, `/specs/*`, `/validation/*`, `/mocks/*`, `/reports/*`, `/drift`, `/team/*`, `/settings/*` routes.

### Structure
- **Sidebar (left, 264px)**
  - Logo + workspace switcher (dropdown)
  - Nav groups:
    - Overview (Dashboard)
    - Specifications
    - Validation (Runs, Testing Workspace)
    - Mocks (Mock Library)
    - Drift & Alerts
    - Reports
    - Team (Members, Audit Log) — visible to `owner`/`admin`
    - Settings
  - Collapse toggle at bottom
- **Topbar (64px)**
  - Page title / breadcrumb
  - Global search (Cmd+K command palette — searches specs, endpoints, mocks, runs)
  - Notifications bell (drift alerts)
  - User menu (avatar dropdown: account settings, sign out)

---

## 5. Dashboard Overview (`/dashboard`)

**Purpose:** At-a-glance health of the workspace's API quality.

### Layout
1. **Stat cards row** (4 cards): APIs monitored, Validation success rate, Schema violations, Generated mocks — each with trend indicator vs. previous period
2. **Charts row** (2 columns)
   - Validation success rate trend (line chart)
   - Violations by type (bar chart)
3. **Recent Validation Runs** (table, last 5–10) — link to `/validation/runs/:runId`
4. **Active Drift Alerts** (compact list, top 3 critical/warning) — link to `/drift`
5. **Quick Actions panel** (glass card): "Upload a spec", "Run validation", "Generate mocks" — shortcuts to relevant flows

### Flow
- Date range selector (top right) refetches all stats/charts via `getDashboardOverview`/`getDashboardCharts`

---

## 6. Specifications

### `/specs` — Specifications List
- Table/grid toggle view
- Columns: Name, Status badge, Version, Endpoint count, Last validated, Monitored (icon if drift enabled), Actions (menu: view, archive, delete)
- Filters: status, monitored only, search
- "New Specification" button → `/specs/new`
- Empty state: illustration + "Upload your first OpenAPI spec"

### `/specs/new` — Upload/Import
- Three tabs: **Upload file** (drag-and-drop zone), **Paste text** (Monaco editor), **Import from URL** (input field)
- Name field (auto-suggested from spec `info.title`)
- On submit: triggers `createSpecificationFrom*`, shows processing state (status `processing`), then redirects to `/specs/:specId` on success or shows error inline on failure

### `/specs/:specId` — Spec Detail
- Header: name, version, status badge, monitored toggle, "Run Validation" button, "Compare Versions" button
- Tabs:
  - **Endpoints** (default) — endpoint explorer: tree grouped by tag, each row shows method badge + path + summary; search/filter by method/tag; click → `/specs/:specId/endpoints/:endpointId`
  - **Schema** — full dereferenced schema tree viewer (read-only Monaco/tree view)
  - **Versions** — list of `specification_version` records, "Create snapshot" button, each row links to compare
  - **Drift Settings** — configure `drift_check` (monitored URL, schedule, enable/disable)
  - **Activity** — comments + relevant audit log entries for this spec

### `/specs/:specId/endpoints/:endpointId` — Endpoint Detail
- Header: method badge + path, operationId, tags, deprecated badge if applicable
- Tabs:
  - **Request** — parameters table, request body schema tree
  - **Responses** — per-status-code schema trees (200, 400, 404, 500, etc.)
  - **Mocks** — mocks generated for this endpoint (mini mock library filtered), "Generate Mock" button
  - **Validation History** — recent `validation_result` rows for this endpoint
- Primary actions: "Test this endpoint" (→ `/validation/workspace` pre-loaded with this endpoint), "Generate Mocks"

### `/specs/:specId/compare` — Version Comparison
- Two dropdowns: "From version" / "To version" (includes "Current")
- On selection: calls `compareSpecificationVersions`, renders:
  - Risk level badge (safe/minor/breaking) prominently at top
  - Added endpoints (list, green)
  - Removed endpoints (list, red, "breaking")
  - Changed endpoints (expandable list, each showing field-level diff with breaking/non-breaking tags)
- "Generate Report" button → creates a `version_comparison` report

---

## 7. Validation

### `/validation` — Validation Runs Timeline
- Vertical timeline or table view (toggle)
- Each entry: trigger type icon, spec name, timestamp, duration, pass/warning/fail counts as mini stacked bar, status badge
- Filters: specification, status, trigger type, date range
- Click → `/validation/runs/:runId`
- "New Validation Run" button → `/validation/workspace`

### `/validation/workspace` — API Testing Workspace
**Layout:** three-panel
- **Left panel:** spec/endpoint selector (searchable tree, same as endpoint explorer)
- **Center panel:** Request builder
  - Method + URL bar (base URL + interpolated path, editable)
  - Tabs: Params, Headers, Auth, Body (Monaco editor, pre-filled from schema/example)
  - "Send Request" button
- **Right panel:** Response viewer
  - Status code, latency, headers (collapsible)
  - Response body (JSON viewer)
  - **Validation Results** section (auto-runs on response received): outcome badge, violations list (expandable, grouped by severity), diff view toggle
  - Actions: "Save as Validation Run", "Generate Mock from Response"

### `/validation/runs/:runId` — Run Detail
- Header: spec name, trigger type, status, summary counts, duration
- Results table: endpoint (method+path), outcome badge, violation count, latency
- Click a row → expands inline or opens drawer with:
  - Request/response snapshot (collapsible JSON viewers)
  - Violations list (grouped by severity, each with path/expected/actual/message)
  - Diff viewer (added/removed/changed)
- "Generate Report from this run" button
- Comments section at bottom

---

## 8. Mock Library

### `/mocks` — Mock Library
- Grid of mock cards (default) or table view
- Each card: endpoint path+method badge, status code badge, variant type tag, variant label, tags, pinned star, last updated
- Filters: specification, endpoint, variant type, tags, search
- "Generate Mocks" button → opens modal: select spec/endpoint, status code, variant type(s), count, custom rules (optional) → calls `generateMock`/`generateMockVariants`/etc.
- Click a card → `/mocks/:mockId`

### `/mocks/:mockId` — Mock Detail
- Header: endpoint, status code, variant info, tags, pin toggle
- JSON viewer (editable for `custom` variants)
- "Regenerate" button (with seed/rules editor)
- "Serving" panel: enable/disable, latency slider, header overrides, shows the public serving URL + copy `curl` command
- "Download JSON" button
- Generation rules viewer (if applicable)

---

## 9. Reports

### `/reports` — Reports List
- Table: title, type badge, spec, date range, generated date, actions (view, download HTML/PDF/JSON, delete)
- "Generate Report" button → modal: select report type, scope (spec, date range or specific runs)

### `/reports/:reportId` — Report Viewer
- Rendered HTML report embedded (iframe or styled container matching design system)
- Download buttons: PDF, JSON, HTML
- For `version_comparison` reports: renders the comparison UI from §6 in read-only/report form

---

## 10. Drift & Alerts

### `/drift` — Drift & Breaking Change Alerts
- Summary cards: open alerts by severity (critical/warning/info)
- Alerts table: severity badge, alert type, spec/endpoint, title, status, created date
- Filters: specification, status, severity, alert type
- Click row → drawer with full details (diff, affected endpoint, link to source validation run)
- Actions per alert: Acknowledge, Resolve, Ignore
- "Notification Channels" section/tab: list configured channels, add new (email/Slack/webhook), toggle event subscriptions

---

## 11. Team

### `/team/members`
- Table: name, email, role, joined date, actions (change role, remove) — role-gated
- "Invite Member" button → modal (email + role)
- Pending invitations list

### `/team/audit-log`
- Table: timestamp, actor, action, entity type/id (linked where possible), details (expandable)
- Filters: actor, action type, entity type, date range
- Role-gated to `owner`/`admin`

---

## 12. Settings

### `/settings/account`
- Profile (name, email, avatar), password change, connected OAuth accounts, session management (active sessions, sign out others)

### `/settings/workspace`
- Workspace name, slug, logo
- Danger zone: delete workspace (role: `owner`)

### `/settings/api-keys`
- Table: name, key prefix, scopes, last used, expires, actions (revoke)
- "Create API Key" button → modal: name, scopes (checkboxes: `mocks:read`, `validation:write`, etc.), optional expiry → shows raw key once with copy button

---

## 13. Cross-Cutting Flows

### Global Search / Command Palette (Cmd+K)
- Searches across: specifications (by name), endpoints (by path), mocks (by name/tag), validation runs (by spec name/date)
- Results grouped by entity type, each navigable

### Notifications (Bell icon)
- Shows recent `drift_alert` entries (open, critical/warning) for the workspace
- Click → `/drift` filtered to that alert

### Onboarding (first-time workspace)
- Modal/wizard after first workspace creation: "Upload your first spec" → `/specs/new`, with optional skip
