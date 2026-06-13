# Auth & Permissions — API Response Validator & Mock Generator

Authentication via **Better Auth**; multitenancy via Better Auth's **organization plugin** (referred to as "workspace" throughout the product).

---

## 1. Authentication Methods

- **Email/password** — standard Better Auth email+password flow, with email verification enabled
- **OAuth providers** — GitHub and Google (primary for developer audience)
- **Password reset** — email-based reset token flow
- **Session management** — Better Auth sessions (cookie-based), configurable expiry (default 30 days), "sign out other sessions" supported in `/settings/account`

---

## 2. Workspace Model

- Each `user` can belong to multiple `organization` (workspace) records via `member`
- A "default"/active workspace is tracked per session (stored in session metadata or a user preference); switchable via `WorkspaceSwitcher`
- New users are prompted to create a workspace on first login if they have none (and have no pending invitations to accept)

---

## 3. Roles

Defined via `member.role`:

| Role | Description |
|---|---|
| `owner` | Full control: billing/workspace settings, delete workspace, manage all members including other owners, full API key management |
| `admin` | Manage members (except owners), manage all specs/validation/mocks/reports/drift, view audit log, configure notification channels |
| `editor` | Create/edit specs, run validations, generate mocks, generate reports, configure drift checks, comment — cannot manage members or view audit log |
| `viewer` | Read-only access to specs, validation runs, mocks, reports, drift alerts; can comment |

---

## 4. Permission Matrix

| Action | owner | admin | editor | viewer |
|---|---|---|---|---|
| View dashboard/specs/runs/mocks/reports/drift | ✅ | ✅ | ✅ | ✅ |
| Upload/edit/archive specifications | ✅ | ✅ | ✅ | ❌ |
| Delete specification (hard delete) | ✅ | ✅ | ❌ | ❌ |
| Run validations (manual/bulk) | ✅ | ✅ | ✅ | ❌ |
| Generate/edit/delete mocks | ✅ | ✅ | ✅ | ❌ |
| Configure mock serving | ✅ | ✅ | ✅ | ❌ |
| Generate reports | ✅ | ✅ | ✅ | ❌ |
| Configure drift checks | ✅ | ✅ | ✅ | ❌ |
| Acknowledge/resolve/ignore drift alerts | ✅ | ✅ | ✅ | ❌ |
| Add comments | ✅ | ✅ | ✅ | ✅ |
| Delete others' comments | ✅ | ✅ | ❌ | ❌ |
| Invite/remove members | ✅ | ✅ | ❌ | ❌ |
| Change member roles | ✅ | partial* | ❌ | ❌ |
| View audit log | ✅ | ✅ | ❌ | ❌ |
| Manage API keys | ✅ | ✅ | ❌ | ❌ |
| Configure notification channels | ✅ | ✅ | ❌ | ❌ |
| Update workspace settings (name, logo) | ✅ | ✅ | ❌ | ❌ |
| Delete workspace | ✅ | ❌ | ❌ | ❌ |
| Promote/demote `owner` role | ✅ | ❌ | ❌ | ❌ |

\* `admin` can change roles among `editor`/`viewer`/`admin` but cannot grant or revoke `owner`.

---

## 5. API Key Scopes

Used by the public API (`api_spec.md` §9):

| Scope | Grants |
|---|---|
| `mocks:read` | `GET /api/public/mocks/:mockId` |
| `validation:write` | `POST /api/public/validation-runs` |
| `specs:read` | (future) read-only access to spec/endpoint metadata |

API keys are created by `owner`/`admin`, scoped to the workspace, and stored hashed (`key_hash`). Revocation is immediate.

---

## 6. Server Function Authorization Pattern

Every server function:

1. Resolves session → `userId`
2. Resolves active `workspaceId` (from request context/header, validated against the user's memberships)
3. Loads `member.role` for `(workspaceId, userId)`
4. Checks role against the permission matrix above before executing
5. Throws `AppError('FORBIDDEN', ...)` if unauthorized (per `api_spec.md` §11)

A shared `requireRole(role: Role[])` helper wraps this pattern for reuse across `app/server/functions/*`.

---

## 7. Data Isolation

- All domain tables include `workspace_id`; every query is filtered by the active workspace
- No cross-workspace queries are permitted at the data-access layer — enforced via a Drizzle query helper that automatically injects the `workspace_id` filter
- R2 storage keys are namespaced by `workspace_id` (e.g., `workspaces/{workspaceId}/specs/{specId}/document.json`) to prevent path-based leakage
