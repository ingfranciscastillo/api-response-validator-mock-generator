# Features Specification — API Response Validator & Mock Generator

Detailed functional specification for each core module, including business rules, data shapes, and edge cases.

---

## 1. Specification Ingestion

### Inputs
- Upload file: `.json`, `.yaml`, `.yml`
- Paste raw text (JSON or YAML)
- Import via URL (fetch remote spec)

### Processing Pipeline
1. **Parse** — detect format (JSON/YAML), parse via `@apidevtools/swagger-parser`
2. **Validate spec structure** — ensure it's a valid OpenAPI 2.0/3.0/3.1 document; surface structural errors with line/path references
3. **Dereference** — resolve all `$ref` pointers into a fully expanded schema tree; cache as `dereferenced_schema`
4. **Extract endpoints** — iterate `paths` × methods, create one `endpoint` row per path+method, extracting:
   - Request schema (path/query/header params + request body schema)
   - Response schemas per status code
   - Tags, operationId, summary, deprecated flag
5. **Size check** — if raw document or dereferenced schema exceeds 200KB, upload to R2 and store `storage_key`; otherwise store inline as JSONB
6. **Status transitions**: `processing` → `active` on success, → `error` with `processing_error` message on failure

### Validation Rules
- Reject specs missing required root fields (`openapi`/`swagger`, `info`, `paths`)
- Warn (but don't block) on specs with zero endpoints
- Detect and report circular `$ref` chains (allowed, but flagged in UI as "circular reference" badge on schema tree nodes)

---

## 2. Schema Validation Engine

### Core Flow
Given an `endpoint` and an actual API response (status code + headers + body):

1. Look up `response_schemas[statusCode]` for the endpoint. If no exact match, check for a default/wildcard response definition (e.g., `default`, `2XX`)
2. Compile schema with **Ajv** (`strict: false`, `allErrors: true`, with `ajv-formats` for format validation — `date-time`, `uuid`, `email`, etc.)
3. Validate the response body against the compiled schema
4. Translate Ajv errors into structured `violations` (see shape below)
5. Compute `outcome`:
   - `pass` — zero violations
   - `warning` — only non-breaking issues (extra fields when `additionalProperties` is undefined/true, deprecated field usage, format mismatches on non-required fields)
   - `fail` — any breaking violation (missing required field, type mismatch, enum violation on required field, additional properties when `additionalProperties: false`)

### Violation Object Shape
```json
{
  "type": "type_mismatch" | "missing_required" | "extra_field" | "enum_violation" | "format_invalid" | "null_not_allowed" | "array_item_invalid",
  "path": "data.items[2].price",
  "expected": "number",
  "actual": "string",
  "message": "Expected 'price' to be a number but received a string",
  "severity": "warning" | "error"
}
```

### Specific Checks
- **Contract compliance** — overall pass/fail based on Ajv result
- **Required field validation** — every key in `required[]` must be present and non-null (unless `nullable: true` / `type: ["x", "null"]`)
- **Type mismatch detection** — actual JS type vs schema `type` (accounting for `oneOf`/`anyOf`/`allOf`)
- **Enum validation** — value must be one of `enum[]`; flag as `error` if field required, `warning` if optional
- **Nested object validation** — recursive validation through `properties`, with path tracking using dot/bracket notation
- **Array validation** — `items` schema applied to each element; `minItems`/`maxItems`/`uniqueItems` checked
- **Missing property detection** — required properties absent from response
- **Extra field detection** — properties present in response not defined in schema; severity depends on `additionalProperties`:
  - `additionalProperties: false` → `error`
  - `additionalProperties: true` or undefined → `warning` (informational, surfaced as "undocumented field")
  - `additionalProperties: {schema}` → validated against that schema

---

## 3. Difference Detection (Response Diff)

### Purpose
Compare two payloads: (a) actual response vs. expected schema-derived shape, or (b) two actual responses (e.g., across validation runs) to detect behavioral drift.

### Engine
**microdiff** for structural deep-diff, producing a list of changes:
```json
[
  { "type": "CREATE", "path": ["data", "newField"], "value": "..." },
  { "type": "REMOVE", "path": ["data", "oldField"], "oldValue": "..." },
  { "type": "CHANGE", "path": ["data", "status"], "oldValue": "active", "value": "inactive" }
]
```

### Categorization for UI
- **Added fields** — `CREATE` ops not present in schema → flagged as "undocumented addition"
- **Removed fields** — `REMOVE` ops for schema-required fields → flagged as **breaking**
- **Type changes** — `CHANGE` ops where `typeof oldValue !== typeof value` → flagged as **breaking** if field is in schema with a fixed type
- **Value mismatches** — `CHANGE` ops on enum-constrained fields where new value isn't in `enum[]` → flagged as **breaking**
- **Breaking changes** — aggregated view combining the above categories with severity `critical`

### Diff Viewer Output
Side-by-side or unified view with color coding per `design_system.md` (green = added/match, red = removed/breaking, yellow = changed/warning).

---

## 4. Automated Mock Generation

### Generation Modes

| Mode | Description |
|---|---|
| **Examples** | Extract `example`/`examples` values directly from the OpenAPI spec where defined |
| **Faker-style generated** | Use `json-schema-faker` configured with `@faker-js/faker` to produce realistic values based on schema `format`, field name heuristics, and type |
| **Custom rules** | User-defined per-field overrides (static values, faker function selection, regex patterns, value ranges) stored in `generation_rules` |
| **Multiple variants** | Generate N distinct mocks for the same endpoint+status using different seeds |
| **Edge cases** | Targeted generation: empty arrays/objects, boundary values (min/max length, min/max number), null for nullable fields, maximum nesting depth |
| **Error responses** | Generate mocks for non-2xx status codes defined in the spec (4xx, 5xx), using the same engine against error schemas |

### Field Name → Faker Mapping (heuristics applied during generation)
- `email` → `faker.internet.email`
- `*name*`, `firstName`, `lastName` → `faker.person.*`
- `*url*`, `*link*` → `faker.internet.url`
- `*phone*` → `faker.phone.number`
- `*address*`, `street`, `city`, `zip*`/`postal*` → `faker.location.*`
- `*date*`, `*at` (createdAt, updatedAt) with `format: date-time` → `faker.date.recent` (ISO string)
- `id`, `*id` with `format: uuid` → `faker.string.uuid`
- `price`, `amount`, `*cost*` → `faker.commerce.price`
- `description`, `bio`, `summary` → `faker.lorem.sentence` / `paragraph`
- Fallback by type: `string` → lorem word, `integer`/`number` → random in range (respecting `minimum`/`maximum`), `boolean` → random bool, `array` → 1-3 items via `items` schema, `object` → recurse

### Custom Rules Shape
```json
{
  "fieldOverrides": {
    "data.user.role": { "type": "static", "value": "admin" },
    "data.user.email": { "type": "faker", "method": "internet.email" },
    "data.items[].sku": { "type": "pattern", "regex": "^SKU-[0-9]{6}$" }
  },
  "locale": "en",
  "arrayLength": { "min": 1, "max": 5 }
}
```

### Output Storage
- Generated payload stored in `mock_dataset.payload` (or R2 if large)
- `seed` stored for reproducibility — regenerating with the same seed + rules produces identical output
- Each mock tagged with `variant_type` and optional `variant_label`

---

## 5. API Testing Workspace

### Capabilities
1. **Import specification** — select from existing `specification` records or upload new
2. **Endpoint selection** — browse via endpoint explorer (grouped by tag, searchable)
3. **Request builder** — for the selected endpoint, auto-populate:
   - Path parameters (editable inputs)
   - Query parameters (with defaults/examples from spec)
   - Headers (including auth headers — supports Bearer token, API key, Basic auth based on spec `securitySchemes`)
   - Request body (Monaco editor, pre-filled with example/generated mock based on request schema)
4. **Send request** — executes via server function (server-side fetch to avoid CORS issues), captures status, headers, body, latency
5. **Validate response** — automatically runs the Schema Validation Engine against the captured response; results displayed inline
6. **Save validation report** — persist as a `validation_run` (trigger_type: `manual`) with one `validation_result`
7. **Generate test dataset** — from the captured response, optionally create a `mock_dataset` (variant_type: `custom`, seeded from real data)

### Auth Handling
- Workspace-level "environments" store base URLs + auth credentials (encrypted at rest) for reuse across requests — referenced from settings, not a separate top-level domain table for MVP (can be added as `environment` table in a later iteration if needed)

---

## 6. Validation Runs & Timeline

### Run Types (`trigger_type`)
- `manual` — initiated from the workspace via "Run Validation"
- `workspace` — bulk run across all monitored endpoints of a spec
- `drift_scheduled` — initiated by Inngest cron job
- `api` — initiated via public API (CI/CD integration)

### Timeline View
- Chronological list of `validation_run` records, each showing:
  - Trigger type icon/badge
  - Spec name + version
  - Pass/warning/fail counts (from denormalized totals)
  - Duration (`completed_at - started_at`)
  - Status badge
- Filterable by: specification, date range, status, trigger type
- Clicking a run opens the run detail page showing all `validation_result` rows with per-endpoint outcome, expandable to view request/response/diff/violations

---

## 7. Reporting

### Report Types
- **Validation Summary** — aggregates one or more validation runs: total checks, pass rate %, violations by type, endpoints covered vs. total
- **Coverage** — % of spec endpoints that have at least one validation result in the selected date range, broken down by tag
- **Drift** — summary of `drift_alert` records over a period, grouped by severity and status
- **Version Comparison** — output of comparing two `specification_version` records (see Section 8)

### Generation Process
1. User selects report type, scope (spec, date range, run IDs)
2. Server function aggregates data into `summary` JSONB
3. HTML report rendered server-side from a template (using the aggregated data + design system styling)
4. PDF generated via Playwright rendering the HTML to PDF
5. JSON export is the raw `summary` + referenced run/result data, either inline or as R2 object if large
6. All three artifacts (HTML, PDF, JSON) stored; `report` row created with references

### Report Contents (Validation Summary example)
- Header: workspace name, spec name + version, date range, generated timestamp
- Summary stats cards: total checks, pass rate, violations count, endpoints covered
- Violations breakdown table: violation type × count × affected endpoints
- Endpoint-by-endpoint table: path, method, last outcome, violation count, link to detail
- Charts: pass rate over time (if multiple runs), violations by type (bar chart)

---

## 8. Contract Drift Detection & Breaking Change Alerts

### Drift Check Configuration
- Per-specification: enable monitoring, set `monitored_base_url`, set schedule (cron expression — presets: every 15 min, hourly, every 6 hours, daily)
- Inngest scheduled function (`drift-check.ts`) runs per `drift_check` row where `is_enabled = true` and schedule matches

### Drift Check Execution
1. For each endpoint in the specification (or a configurable subset), send a representative request to `monitored_base_url + endpoint.path`
   - Path parameters filled with example values or last-known-good values from previous mocks
2. Validate the actual response against the endpoint's documented schema (reuse Schema Validation Engine)
3. Create a `validation_run` (trigger_type: `drift_scheduled`) with results
4. For each `validation_result` with `outcome != pass`:
   - Compare against the **previous** drift check's result for the same endpoint
   - If this is a **new** violation (didn't exist in the prior run) → create `drift_alert`
     - `alert_type: schema_drift` for general violations
     - `alert_type: breaking_change` if violation type is in the breaking set (missing required field, type change, removed field, enum violation on required field)
   - `severity`: `critical` for breaking changes, `warning` for non-breaking drift, `info` for new undocumented fields
5. Update `drift_check.last_run_at` and `last_run_validation_id`

### Alert Lifecycle
- `open` → default state on creation
- `acknowledged` → team member has seen it (sets `acknowledged_by`/`acknowledged_at`)
- `resolved` → issue fixed (spec updated or API fixed) — typically auto-detected if the same check no longer reproduces the violation, or manually marked
- `ignored` → team explicitly dismisses (won't re-alert for this exact violation signature)

### Notifications
- On `drift_alert` creation with `severity: critical` or `warning`, dispatch to all enabled `notification_channel` rows in the workspace where `events` includes the matching type
- Email via transactional email provider (configurable); Slack/generic webhook via POST with structured JSON payload

---

## 9. Version Comparison (Spec-to-Spec)

### Inputs
Two `specification_version` records (or current `specification` vs. a historical version) of the same logical specification.

### Comparison Process
1. Build a map of `{path}::{method}` → endpoint definition for each version
2. **Added endpoints** — present in new, absent in old
3. **Removed endpoints** — present in old, absent in new → flagged as **breaking** (consumers calling these will fail)
4. **Changed schemas** — for endpoints present in both, deep-diff request/response schemas:
   - New required field added to request → **breaking** (existing clients won't send it)
   - Required field removed from request → non-breaking (relaxation)
   - New field added to response → non-breaking (additive)
   - Field removed from response → **breaking** if consumers may depend on it
   - Field type changed → **breaking**
   - Enum values removed → **breaking**; enum values added → non-breaking
   - Response status code added → non-breaking; response status code removed → **breaking**
5. **Compatibility risk score** — aggregate count of breaking vs. non-breaking changes, surfaced as an overall risk badge (`safe` / `minor` / `breaking`)

### Output
Structured comparison object stored as part of a `report` (`report_type: version_comparison`) and/or surfaced live in the Spec Detail → Compare tab:
```json
{
  "addedEndpoints": [...],
  "removedEndpoints": [...],
  "changedEndpoints": [
    {
      "path": "/users/{id}",
      "method": "GET",
      "changes": [
        { "category": "response_field_removed", "field": "data.legacyId", "breaking": true },
        { "category": "response_field_added", "field": "data.preferences", "breaking": false }
      ]
    }
  ],
  "riskLevel": "breaking"
}
```

---

## 10. Mock Library

### Organization
- Grouped by specification → endpoint, with flat search/filter view as primary entry point
- Filters: specification, endpoint (path/method), `variant_type`, tags, date range
- Search: full-text on `name`, `variant_label`, `tags`

### Actions per Mock
- **Preview** — Monaco/JSON viewer modal showing `payload`
- **Download** — export as `.json` file
- **Copy** — copy payload or copy a `curl` command to fetch it from the public mock-serving endpoint
- **Regenerate** — re-run generation with same or new seed/rules
- **Pin** — `is_pinned` for quick access
- **Enable serving** — toggle `mock_serve_config.is_enabled`, configure simulated latency and header overrides

### Public Mock-Serving API
- `GET /api/public/mocks/:mockId` — returns `mock_dataset.payload` with configured `response_headers_override` and simulated `latency_ms` delay
- Authenticated via `api_key` (Bearer token), scoped to `mocks:read`
- Respects `mock_serve_config.is_enabled` (returns 404 if disabled)

---

## 11. Team Collaboration

### Shared Workspaces
- All data scoped by `workspace_id`; members access based on role (see `auth_and_permissions.md`)

### Comments
- Attachable to: specifications, validation runs, validation results, mock datasets, drift alerts
- Threaded display (flat list ordered by `created_at`, no nested replies in MVP)
- `@mention` support deferred to post-MVP

### Audit Logs
- Every mutating action writes an `audit_log` row (see `database.md` for shape)
- Audit log viewer: filterable by actor, action type, entity type, date range
- Read-only, immutable, accessible to `owner`/`admin` roles only

---

## 12. Dashboard Overview Metrics

Computed (cached/refreshed periodically or on-demand):

- **APIs monitored** — count of `specification` where `is_monitored = true`
- **Validation success rate** — `passed_checks / total_checks` across runs in the selected period (default: last 30 days)
- **Schema violations** — count of `validation_result` where `outcome != pass` in the selected period
- **Generated mocks** — count of `mock_dataset` created in the selected period
- **Recent validation runs** — last 5–10 `validation_run` records with status badges

Charts: success rate trend (line, daily buckets), violations by type (bar), validation volume (area chart).
