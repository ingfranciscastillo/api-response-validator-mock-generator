# Database — API Response Validator & Mock Generator

Database: **Neon (serverless Postgres)**, accessed via **Drizzle ORM**. All domain tables are scoped by `workspace_id` for multitenancy. Auth tables follow Better Auth's schema conventions (with its organization plugin providing `organization`, `member`, `invitation` — referred to here as "workspace").

---

## 1. Conventions

- Primary keys: `text` (UUID v7 generated via `crypto.randomUUID()` or `uuid_generate_v7()` if available), stored as `text` for Better Auth compatibility
- Timestamps: `created_at`, `updated_at` (`timestamp` with timezone, default `now()`)
- Soft deletes: `deleted_at` (`timestamp`, nullable) on user-facing entities where recovery matters (specs, mocks, reports)
- JSONB columns used for flexible/nested data (OpenAPI documents, schemas, validation results, mock payloads)
- Foreign keys: `on delete cascade` for workspace-scoped children; `on delete set null` for optional references (e.g., `created_by`)

---

## 2. Auth & Workspace Tables (Better Auth)

These follow Better Auth's core + organization plugin schema. Listed here for reference/extension points.

### `user`
| Column | Type | Notes |
|---|---|---|
| id | text PK | |
| name | text | |
| email | text unique | |
| email_verified | boolean | |
| image | text | nullable, avatar URL |
| created_at | timestamp | |
| updated_at | timestamp | |

### `session`
Standard Better Auth session table (id, user_id, token, expires_at, ip_address, user_agent).

### `account`
Standard Better Auth account table (OAuth provider links, password hashes).

### `organization` (Workspace)
| Column | Type | Notes |
|---|---|---|
| id | text PK | |
| name | text | |
| slug | text unique | |
| logo | text | nullable |
| created_at | timestamp | |
| metadata | jsonb | plan info, settings |

### `member`
| Column | Type | Notes |
|---|---|---|
| id | text PK | |
| organization_id | text FK → organization.id | |
| user_id | text FK → user.id | |
| role | text | `owner` \| `admin` \| `editor` \| `viewer` (see `auth_and_permissions.md`) |
| created_at | timestamp | |

### `invitation`
Standard Better Auth invitation table (id, organization_id, email, role, status, expires_at, inviter_id).

### `api_key`
Custom table for programmatic access (used for the public mock-serving API and CI integrations).

| Column | Type | Notes |
|---|---|---|
| id | text PK | |
| workspace_id | text FK → organization.id, on delete cascade | |
| name | text | label for the key |
| key_hash | text | hashed key value |
| key_prefix | text | first 8 chars, shown in UI for identification |
| scopes | jsonb | array of scope strings, e.g. `["mocks:read", "validation:write"]` |
| last_used_at | timestamp | nullable |
| expires_at | timestamp | nullable |
| created_by | text FK → user.id, on delete set null | |
| created_at | timestamp | |

---

## 3. Specifications Domain

### `specification`
Represents an uploaded/pasted OpenAPI document.

| Column | Type | Notes |
|---|---|---|
| id | text PK | |
| workspace_id | text FK → organization.id, on delete cascade | |
| name | text | display name |
| description | text | nullable |
| source_format | text | `openapi_3_1` \| `openapi_3_0` \| `swagger_2_0` |
| version_label | text | semantic/spec version, e.g. "v2.3.0" (user-defined or parsed from `info.version`) |
| raw_document | jsonb | nullable — full parsed spec if under size threshold |
| storage_key | text | nullable — R2 object key if spec exceeds inline size threshold |
| dereferenced_schema | jsonb | nullable — fully resolved `$ref` schema, cached for validation/mock use |
| endpoint_count | integer | denormalized count |
| status | text | `processing` \| `active` \| `error` \| `archived` |
| processing_error | text | nullable, error message if parsing failed |
| is_monitored | boolean | default false — whether drift detection runs against this spec |
| monitored_base_url | text | nullable — base URL for production drift checks |
| created_by | text FK → user.id, on delete set null | |
| created_at | timestamp | |
| updated_at | timestamp | |
| deleted_at | timestamp | nullable |

**Indexes:** `(workspace_id, status)`, `(workspace_id, created_at desc)`

### `specification_version`
Stores historical versions of a specification for version comparison.

| Column | Type | Notes |
|---|---|---|
| id | text PK | |
| specification_id | text FK → specification.id, on delete cascade | |
| version_label | text | |
| raw_document | jsonb | nullable |
| storage_key | text | nullable |
| dereferenced_schema | jsonb | nullable |
| created_by | text FK → user.id, on delete set null | |
| created_at | timestamp | |

**Indexes:** `(specification_id, created_at desc)`

### `endpoint`
A single path+method combination extracted from a specification.

| Column | Type | Notes |
|---|---|---|
| id | text PK | |
| specification_id | text FK → specification.id, on delete cascade | |
| workspace_id | text FK → organization.id, on delete cascade | denormalized for query scoping |
| path | text | e.g. `/users/{id}` |
| method | text | `GET` \| `POST` \| `PUT` \| `PATCH` \| `DELETE` \| `OPTIONS` \| `HEAD` |
| operation_id | text | nullable, from spec |
| summary | text | nullable |
| tags | jsonb | array of strings |
| request_schema | jsonb | nullable — parameters + request body schema |
| response_schemas | jsonb | map of status code → response schema, e.g. `{"200": {...}, "404": {...}}` |
| deprecated | boolean | default false |
| created_at | timestamp | |
| updated_at | timestamp | |

**Indexes:** `(specification_id)`, `(workspace_id, path, method)`, unique `(specification_id, path, method)`

---

## 4. Validation Domain

### `validation_run`
A single execution of validating one or more API responses against a specification.

| Column | Type | Notes |
|---|---|---|
| id | text PK | |
| workspace_id | text FK → organization.id, on delete cascade | |
| specification_id | text FK → specification.id, on delete set null | nullable in case spec is later deleted |
| name | text | nullable — optional label for the run |
| trigger_type | text | `manual` \| `workspace` \| `drift_scheduled` \| `api` |
| status | text | `running` \| `completed` \| `failed` |
| total_checks | integer | default 0 |
| passed_checks | integer | default 0 |
| warning_checks | integer | default 0 |
| failed_checks | integer | default 0 |
| started_at | timestamp | |
| completed_at | timestamp | nullable |
| created_by | text FK → user.id, on delete set null | |
| created_at | timestamp | |

**Indexes:** `(workspace_id, created_at desc)`, `(specification_id, created_at desc)`, `(workspace_id, status)`

### `validation_result`
A single endpoint validation outcome within a run.

| Column | Type | Notes |
|---|---|---|
| id | text PK | |
| validation_run_id | text FK → validation_run.id, on delete cascade | |
| endpoint_id | text FK → endpoint.id, on delete set null | nullable if endpoint later removed |
| workspace_id | text FK → organization.id, on delete cascade | denormalized |
| request_snapshot | jsonb | method, path, headers, query params, body sent |
| response_status_code | integer | |
| response_headers | jsonb | |
| response_body | jsonb | actual response received |
| expected_schema | jsonb | the schema used for comparison |
| outcome | text | `pass` \| `warning` \| `fail` |
| violations | jsonb | array of violation objects (see `features_spec.md` for shape) |
| diff | jsonb | structured diff (added/removed/changed fields) |
| latency_ms | integer | nullable |
| created_at | timestamp | |

**Indexes:** `(validation_run_id)`, `(endpoint_id, created_at desc)`, `(workspace_id, outcome)`

---

## 5. Mock Generation Domain

### `mock_dataset`
A generated mock response (or set of variants) tied to an endpoint.

| Column | Type | Notes |
|---|---|---|
| id | text PK | |
| workspace_id | text FK → organization.id, on delete cascade | |
| specification_id | text FK → specification.id, on delete cascade | |
| endpoint_id | text FK → endpoint.id, on delete cascade | |
| name | text | display name, auto-generated or user-defined |
| status_code | integer | the response status this mock represents |
| variant_type | text | `example` \| `generated` \| `custom` \| `edge_case` \| `error` |
| variant_label | text | nullable — e.g. "Empty list", "Max length strings", "Rate limited" |
| payload | jsonb | nullable — the mock body if under size threshold |
| storage_key | text | nullable — R2 key for large payloads |
| generation_rules | jsonb | nullable — custom rules used (faker locales, field overrides, seed) |
| seed | text | nullable — for reproducible generation |
| tags | jsonb | array of strings, for search/filter |
| is_pinned | boolean | default false |
| created_by | text FK → user.id, on delete set null | |
| created_at | timestamp | |
| updated_at | timestamp | |
| deleted_at | timestamp | nullable |

**Indexes:** `(workspace_id, created_at desc)`, `(endpoint_id, status_code)`, `(specification_id)`, GIN index on `tags`

### `mock_serve_config`
Configuration for serving a mock via the public mock-serving API.

| Column | Type | Notes |
|---|---|---|
| id | text PK | |
| workspace_id | text FK → organization.id, on delete cascade | |
| mock_dataset_id | text FK → mock_dataset.id, on delete cascade | |
| is_enabled | boolean | default true |
| latency_ms | integer | default 0 — simulated latency |
| response_headers_override | jsonb | nullable |
| created_at | timestamp | |

**Indexes:** unique `(mock_dataset_id)`

---

## 6. Reports Domain

### `report`
A generated, exportable report covering one or more validation runs.

| Column | Type | Notes |
|---|---|---|
| id | text PK | |
| workspace_id | text FK → organization.id, on delete cascade | |
| specification_id | text FK → specification.id, on delete set null | |
| title | text | |
| report_type | text | `validation_summary` \| `coverage` \| `drift` \| `version_comparison` |
| date_range_start | timestamp | nullable |
| date_range_end | timestamp | nullable |
| summary | jsonb | aggregated stats (pass rate, violation counts, endpoint coverage, etc.) |
| validation_run_ids | jsonb | array of `validation_run.id` included |
| html_storage_key | text | nullable — R2 key for rendered HTML |
| pdf_storage_key | text | nullable — R2 key for rendered PDF |
| json_storage_key | text | nullable — R2 key for JSON export (if large) |
| json_payload | jsonb | nullable — inline JSON export if small |
| created_by | text FK → user.id, on delete set null | |
| created_at | timestamp | |

**Indexes:** `(workspace_id, created_at desc)`, `(specification_id)`, `(workspace_id, report_type)`

---

## 7. Drift & Breaking Change Domain

### `drift_check`
A scheduled or manual check comparing live production responses to the documented spec.

| Column | Type | Notes |
|---|---|---|
| id | text PK | |
| workspace_id | text FK → organization.id, on delete cascade | |
| specification_id | text FK → specification.id, on delete cascade | |
| schedule | text | cron expression, nullable if manual-only |
| is_enabled | boolean | default true |
| last_run_at | timestamp | nullable |
| last_run_validation_id | text FK → validation_run.id, on delete set null | nullable |
| created_at | timestamp | |
| updated_at | timestamp | |

**Indexes:** `(workspace_id)`, unique `(specification_id)`

### `drift_alert`
A detected instance of drift or a breaking change requiring attention.

| Column | Type | Notes |
|---|---|---|
| id | text PK | |
| workspace_id | text FK → organization.id, on delete cascade | |
| specification_id | text FK → specification.id, on delete cascade | |
| endpoint_id | text FK → endpoint.id, on delete set null | |
| validation_run_id | text FK → validation_run.id, on delete set null | nullable |
| specification_version_id | text FK → specification_version.id, on delete set null | nullable — for version-comparison-sourced alerts |
| alert_type | text | `schema_drift` \| `breaking_change` \| `new_field` \| `removed_field` \| `type_change` |
| severity | text | `info` \| `warning` \| `critical` |
| title | text | short summary |
| details | jsonb | structured diff/details |
| status | text | `open` \| `acknowledged` \| `resolved` \| `ignored` |
| acknowledged_by | text FK → user.id, on delete set null | nullable |
| acknowledged_at | timestamp | nullable |
| created_at | timestamp | |

**Indexes:** `(workspace_id, status, created_at desc)`, `(specification_id)`, `(endpoint_id)`

---

## 8. Collaboration & Audit Domain

### `comment`
Team comments attached to validation runs, results, specs, or drift alerts.

| Column | Type | Notes |
|---|---|---|
| id | text PK | |
| workspace_id | text FK → organization.id, on delete cascade | |
| author_id | text FK → user.id, on delete set null | |
| entity_type | text | `specification` \| `validation_run` \| `validation_result` \| `mock_dataset` \| `drift_alert` |
| entity_id | text | polymorphic reference, no FK constraint |
| body | text | |
| created_at | timestamp | |
| updated_at | timestamp | |
| deleted_at | timestamp | nullable |

**Indexes:** `(workspace_id, entity_type, entity_id)`

### `audit_log`
Immutable record of significant actions for compliance/team visibility.

| Column | Type | Notes |
|---|---|---|
| id | text PK | |
| workspace_id | text FK → organization.id, on delete cascade | |
| actor_id | text FK → user.id, on delete set null | nullable (system actions have null) |
| action | text | e.g. `specification.created`, `validation_run.completed`, `mock_dataset.deleted`, `member.invited`, `drift_alert.resolved` |
| entity_type | text | |
| entity_id | text | |
| metadata | jsonb | action-specific details (e.g., old/new values) |
| ip_address | text | nullable |
| created_at | timestamp | |

**Indexes:** `(workspace_id, created_at desc)`, `(workspace_id, entity_type, entity_id)`

---

## 9. Notifications Domain (supporting Breaking Change Alerts)

### `notification_channel`
Where alerts get delivered (email, Slack webhook, etc.)

| Column | Type | Notes |
|---|---|---|
| id | text PK | |
| workspace_id | text FK → organization.id, on delete cascade | |
| channel_type | text | `email` \| `slack_webhook` \| `webhook` |
| target | text | email address / webhook URL |
| events | jsonb | array of event types to notify on, e.g. `["breaking_change", "drift_critical"]` |
| is_enabled | boolean | default true |
| created_by | text FK → user.id, on delete set null | |
| created_at | timestamp | |

**Indexes:** `(workspace_id)`

---

## 10. Entity Relationship Summary

```
organization (workspace)
 ├── member (users)
 ├── api_key
 ├── specification
 │    ├── specification_version (history)
 │    ├── endpoint
 │    │    ├── mock_dataset
 │    │    │    └── mock_serve_config
 │    │    └── validation_result (via validation_run)
 │    ├── drift_check
 │    │    └── drift_alert
 │    └── report
 ├── validation_run
 │    └── validation_result
 ├── comment (polymorphic)
 ├── audit_log
 └── notification_channel
```

---

## 11. Drizzle Schema File Mapping

Per `architecture.md` structure (`app/server/db/schema/`):

- `auth.ts` → `user`, `session`, `account`, `organization`, `member`, `invitation`, `api_key`
- `specs.ts` → `specification`, `specification_version`
- `endpoints.ts` → `endpoint`
- `validation.ts` → `validation_run`, `validation_result`
- `mocks.ts` → `mock_dataset`, `mock_serve_config`
- `reports.ts` → `report`
- `drift.ts` → `drift_check`, `drift_alert`, `notification_channel`
- `audit.ts` → `comment`, `audit_log`

All schema files export Drizzle table definitions plus `drizzle-zod`-generated `insert`/`select` Zod schemas for use in server functions.
