# Acceptance Criteria — API Response Validator & Mock Generator

Concrete, testable criteria for the highest-risk logic modules, plus phase-completion checklists that extend the "Done when" statements in `roadmap.md`. Use these as the basis for unit tests and manual QA passes.

---

## 1. OpenAPI Ingestion (`features_spec.md` §1)

- [ ] Uploading a valid OpenAPI 3.1 JSON file results in `specification.status = 'active'`, with `endpoint_count` matching the number of path+method combinations in the spec
- [ ] Uploading a valid Swagger 2.0 YAML file is parsed and converted correctly; `source_format = 'swagger_2_0'`
- [ ] Uploading a spec missing `info` or `paths` results in `status = 'error'` with a descriptive `processing_error`
- [ ] A spec with zero endpoints (`paths: {}`) is accepted with `status = 'active'` and `endpoint_count = 0`, and the UI shows an appropriate empty state
- [ ] A spec containing `$ref` pointers is fully dereferenced — `dereferenced_schema` contains no unresolved `$ref` keys
- [ ] A spec with a circular `$ref` (e.g., `Node.children[].$ref = '#/components/schemas/Node'`) is accepted, dereferenced to a bounded depth, and the affected schema tree nodes are flagged with a "circular reference" indicator in `SchemaTreeViewer`
- [ ] A raw document or dereferenced schema exceeding 200KB is stored in R2 (`storage_key` populated, `raw_document`/`dereferenced_schema` null); one under 200KB is stored inline (JSONB populated, `storage_key` null)
- [ ] Importing from a URL that returns a non-spec JSON/HTML page results in `status = 'error'` with a clear message (not a silent empty spec)
- [ ] Each extracted `endpoint` has the correct `request_schema` (params + body) and `response_schemas` map keyed by status code, including a `default` key if present in the source spec

---

## 2. Schema Validation Engine (`features_spec.md` §2)

For a given endpoint response schema and actual response body:

- [ ] **Pass case:** a response matching the schema exactly produces `outcome = 'pass'` and `violations = []`
- [ ] **Missing required field:** a response omitting a field listed in `required[]` produces a `missing_required` violation with `severity = 'error'` and `outcome = 'fail'`
- [ ] **Type mismatch:** a field typed `number` in the schema but returned as a string produces a `type_mismatch` violation with `expected: 'number'`, `actual: 'string'`, `severity = 'error'`, `outcome = 'fail'`
- [ ] **Enum violation (required field):** a required field with `enum: ['active','inactive']` returning `'pending'` produces an `enum_violation` with `severity = 'error'`, `outcome = 'fail'`
- [ ] **Enum violation (optional field):** same as above but the field is not in `required[]` → `severity = 'warning'`, `outcome` is `'warning'` (assuming no other errors)
- [ ] **Extra field, `additionalProperties: false`:** a response containing a property not defined in `properties` produces an `extra_field` violation with `severity = 'error'`, `outcome = 'fail'`
- [ ] **Extra field, `additionalProperties` undefined/true:** same scenario produces an `extra_field` violation with `severity = 'warning'`, and `outcome` is `'warning'` if no other errors exist
- [ ] **Extra field with typed `additionalProperties`:** the extra field is validated against the `additionalProperties` schema; if it doesn't match, produces a `type_mismatch` or relevant violation at `severity = 'error'`
- [ ] **Nested object validation:** a violation inside a nested object (e.g., `data.user.address.zipCode`) produces a violation with `path = 'data.user.address.zipCode'` (correct dot notation)
- [ ] **Array item validation:** an array where one item fails its `items` schema produces a violation with `path` including the index (e.g., `data.items[2].price`)
- [ ] **`minItems`/`maxItems`/`uniqueItems`:** violating any of these on an array produces an `array_item_invalid` violation (or a dedicated constraint violation) with `severity = 'error'`
- [ ] **Nullable fields:** a field with `nullable: true` (3.0) or `type: ['string','null']` (3.1) returning `null` produces **no** `null_not_allowed` violation
- [ ] **Format validation:** a field with `format: 'email'` returning a non-email string produces a `format_invalid` violation; severity is `error` if required, `warning` if optional
- [ ] **No matching status code schema:** if the actual response status code has no entry in `response_schemas` and no `default`, the result is `outcome = 'warning'` with a violation indicating "undocumented status code" (not a hard fail, since the endpoint may simply be undocumented for that code)
- [ ] **`oneOf`/`anyOf`:** a response matching at least one subschema in `oneOf`/`anyOf` produces `outcome = 'pass'`; matching none produces violations referencing the closest/best-matching subschema (Ajv's `errors` for the failing branches, deduplicated)
- [ ] **Determinism:** running the engine twice on identical inputs produces byte-identical `violations` and `outcome`

---

## 3. Difference Detection / Response Diff (`features_spec.md` §3)

- [ ] Comparing two identical payloads produces an empty diff (`[]`)
- [ ] A field present in the new payload but absent in the old produces a `CREATE` entry with the correct `path` and `value`
- [ ] A field present in the old payload but absent in the new produces a `REMOVE` entry with the correct `path` and `oldValue`
- [ ] A field whose value type changes (e.g., `string` → `number`) produces a `CHANGE` entry with both `oldValue` and `value`
- [ ] **Categorization — added field not in schema** → labeled "undocumented addition" in the diff viewer, non-breaking
- [ ] **Categorization — removed field that is `required` in schema** → labeled breaking, `severity = critical`
- [ ] **Categorization — type change on a schema-typed field** → labeled breaking
- [ ] **Categorization — value change violating an `enum`** → labeled breaking
- [ ] `DiffViewer` renders `CREATE` in green, `REMOVE` in red (with strikethrough), `CHANGE` with old value struck through and new value highlighted, per `design_system.md` §7

---

## 4. Mock Generation (`features_spec.md` §4)

- [ ] Generating a mock for an endpoint+status code that has an `example` defined in the spec, with `variant_type = 'example'`, returns that example value verbatim (not faker-generated)
- [ ] Generating a `generated` variant produces a payload that **passes** the Schema Validation Engine against the same schema (i.e., mock generation and validation are consistent — a generated mock should never fail its own schema)
- [ ] Field-name heuristics: a field named `email` with `type: string, format: email` produces a valid email string; a field named `userId` with `format: uuid` produces a valid UUID; a field named `createdAt` with `format: date-time` produces a valid ISO 8601 datetime
- [ ] `arrayLength` custom rule (e.g., `{ min: 2, max: 2 }`) produces an array with exactly 2 items for fields governed by that rule
- [ ] `fieldOverrides` with `type: 'static'` produces that exact value at the specified path, even if the schema type differs (e.g., overriding an enum field with a value not in `enum[]` is allowed for custom mocks — used for testing edge cases)
- [ ] `fieldOverrides` with `type: 'pattern'` produces a string matching the given regex
- [ ] **Edge case generation** (`generateEdgeCaseMocks`) produces, at minimum: one variant with empty arrays/objects where allowed, one variant with `minimum`/`maximum` boundary numeric values, one variant with `null` for every nullable field, and one variant at maximum nesting depth for recursive schemas (bounded to avoid infinite generation)
- [ ] **Error mocks** (`generateErrorMocks`) produces one `mock_dataset` per non-2xx status code defined in `response_schemas` for the endpoint, each validating against its respective error schema
- [ ] **Seed reproducibility:** calling `regenerateMock` with the same `seed` and `generationRules` produces a byte-identical `payload` to the original generation
- [ ] **Seed variation:** `generateMockVariants` with `count = 3` and no explicit seeds produces 3 distinct payloads (not identical), each valid against the schema

---

## 5. API Testing Workspace (`features_spec.md` §5)

- [ ] Selecting an endpoint pre-populates the request builder with path/query params (using spec examples/defaults where available) and a request body pre-filled from the request schema (example or generated mock)
- [ ] Sending a request executes server-side (no CORS errors for cross-origin target APIs) and captures status code, headers, body, and latency
- [ ] Upon receiving a response, validation runs automatically and displays `outcome`, `violations`, and `diff` without requiring a separate user action
- [ ] "Save as Validation Run" persists a `validation_run` (`trigger_type = 'manual'`) with exactly one `validation_result` matching the displayed outcome/violations/diff
- [ ] "Generate Mock from Response" creates a `mock_dataset` with `variant_type = 'custom'`, `payload` equal to the captured response body, and `status_code` equal to the captured status code
- [ ] Auth configuration (Bearer/API key/Basic) correctly attaches the configured header to the outgoing request

---

## 6. Version Comparison (`features_spec.md` §9)

Given two specification versions:

- [ ] An endpoint present in the "to" version but not the "from" version appears in `addedEndpoints`
- [ ] An endpoint present in the "from" version but not the "to" version appears in `removedEndpoints` and contributes to `riskLevel = 'breaking'`
- [ ] An endpoint with a new **required** request field in the "to" version is flagged `category: 'request_field_added_required'`, `breaking: true`
- [ ] An endpoint where a required request field becomes optional is flagged `breaking: false`
- [ ] An endpoint where a response field is **removed** is flagged `breaking: true`
- [ ] An endpoint where a new response field is **added** is flagged `breaking: false`
- [ ] An endpoint where a response field's type changes is flagged `breaking: true`
- [ ] An endpoint where an `enum` value is removed from a response field is flagged `breaking: true`; adding an enum value is flagged `breaking: false`
- [ ] A response status code removed (e.g., `200` documented in "from" but not "to") is flagged `breaking: true`; a new status code added is flagged `breaking: false`
- [ ] `riskLevel` is `'safe'` only if there are zero `breaking: true` entries across all categories; `'breaking'` if at least one exists; `'minor'` for non-breaking changes only (and `riskLevel` correctly reflects mixed scenarios — any breaking change anywhere makes the overall level `'breaking'`)
- [ ] Comparing a specification version against itself produces empty `addedEndpoints`, `removedEndpoints`, `changedEndpoints`, and `riskLevel = 'safe'`

---

## 7. Drift Detection & Breaking Change Alerts (`features_spec.md` §8)

- [ ] A `drift_check` with `is_enabled = true` and a valid cron `schedule` triggers the Inngest job at the expected interval
- [ ] Running a drift check executes a request against `monitored_base_url` for each (or configured subset of) endpoints and creates a `validation_run` with `trigger_type = 'drift_scheduled'`
- [ ] A violation that appears for the first time (not present in the previous drift check's results for the same endpoint) creates exactly one `drift_alert`
- [ ] A violation that persists across consecutive drift checks does **not** create a duplicate `drift_alert` (no alert spam for the same ongoing issue)
- [ ] A violation matching the "breaking" set (missing required field, type change, removed field, enum violation on required field) creates a `drift_alert` with `alert_type = 'breaking_change'` and `severity = 'critical'`
- [ ] A non-breaking violation (e.g., undocumented extra field) creates a `drift_alert` with `alert_type = 'schema_drift'` or `'new_field'` and `severity = 'warning'` or `'info'` as appropriate
- [ ] Creating a `drift_alert` with `severity` matching a `notification_channel`'s subscribed `events` triggers a dispatch to that channel (email/Slack/webhook) — verify via mock/stub in tests, not real external calls
- [ ] Marking a `drift_alert` as `resolved` or `ignored` updates `status` and does not affect future alert generation for genuinely new issues
- [ ] `drift_check.last_run_at` and `last_run_validation_id` update after every run (manual or scheduled)

---

## 8. Reporting (`features_spec.md` §7)

- [ ] Generating a `validation_summary` report with a given `dateRangeStart`/`dateRangeEnd` includes only `validation_run` records within that range in its `summary` aggregation
- [ ] The report's `summary.passRate` equals `passed_checks / total_checks` across the included runs (correctly handling `total_checks = 0` → pass rate shown as N/A, not divide-by-zero)
- [ ] HTML, PDF, and JSON artifacts are all generated and their storage references (`html_storage_key`, `pdf_storage_key`, `json_storage_key`/`json_payload`) are populated
- [ ] The PDF export visually matches the HTML report's structure (Playwright render produces a non-empty, multi-section PDF — spot-check page count > 0)
- [ ] A `version_comparison` report's `summary` matches the output of `compareSpecificationVersions` for the same version pair (no divergent logic between live UI comparison and report generation)

---

## 9. Permissions & Multitenancy (`auth_and_permissions.md`)

- [ ] A `viewer` calling `createSpecificationFromPaste` receives `AppError('FORBIDDEN', ...)` and no row is created
- [ ] A user belonging to Workspace A cannot retrieve a `specification` belonging to Workspace B via any server function, even with a valid ID (returns `NOT_FOUND`, not the data)
- [ ] An `editor` can run validations and generate mocks but `listAuditLog` returns `FORBIDDEN` for them
- [ ] Revoking an `api_key` immediately causes subsequent `GET /api/public/mocks/:mockId` requests with that key to return `401`
- [ ] An `api_key` with only `mocks:read` scope receives `403` when calling `POST /api/public/validation-runs`

---

## 10. Phase Completion Checklists

### Phase 0 — Project Setup
- [ ] `pnpm dev` runs without errors; landing page placeholder renders
- [ ] A new user can register, is prompted to create a workspace, and lands on an empty `/dashboard`
- [ ] OAuth (GitHub or Google, at least one) login works end-to-end
- [ ] Dark theme tokens from `design_system.md` are visible (background, text, accent colors render correctly)
- [ ] `pnpm typecheck` and `pnpm lint` pass on the initial scaffold

### Phase 1 — Specifications Core
- [ ] All three ingestion methods (upload, paste, URL) work and produce `status = 'active'` for a valid spec
- [ ] `/specs` list shows the uploaded spec with correct `endpoint_count`
- [ ] `EndpointExplorer` on `/specs/:specId` lists all endpoints, grouped by tag, with correct `MethodBadge` colors
- [ ] `SchemaTreeViewer` correctly renders nested objects, arrays, enums, and `$ref`-resolved schemas for at least one endpoint
- [ ] Relevant items from Acceptance Criteria §1 pass

### Phase 2 — Validation Engine
- [ ] All applicable items from Acceptance Criteria §2 and §3 pass as unit tests
- [ ] API Testing Workspace items from Acceptance Criteria §5 pass
- [ ] `/validation` timeline shows a manually-run validation with correct pass/warning/fail counts
- [ ] `/validation/runs/:runId` shows per-endpoint results with working `ViolationsList` and `DiffViewer`

### Phase 3 — Mock Generation
- [ ] All applicable items from Acceptance Criteria §4 pass as unit tests
- [ ] `/mocks` library shows generated mocks with correct variant tags and filters work
- [ ] Public mock-serving endpoint returns the correct payload, respects `is_enabled` and `latency_ms`
- [ ] An external `curl` request with a valid API key successfully retrieves a mock

### Phase 4 — Dashboard & Reporting
- [ ] `/dashboard` stat cards reflect real counts from seeded/test data (verify at least one non-zero metric end-to-end)
- [ ] Charts render with real data and update when the date range changes
- [ ] Acceptance Criteria §8 items pass
- [ ] Downloaded PDF and JSON reports open correctly and contain expected data

### Phase 5 — Drift Detection & Breaking Changes
- [ ] Acceptance Criteria §6 and §7 items pass as unit/integration tests
- [ ] A manually triggered drift check against a mock/test API produces a `validation_run` and, where applicable, `drift_alert` records
- [ ] `/drift` page shows alerts with correct severity badges and filtering
- [ ] `/specs/:specId/compare` renders a working comparison for two real spec versions

### Phase 6 — Team Collaboration & Polish
- [ ] Acceptance Criteria §9 items pass
- [ ] Comments can be added/deleted on at least two entity types (e.g., `validation_run` and `mock_dataset`) with correct role gating
- [ ] `/team/audit-log` shows entries for actions performed during testing (spec upload, validation run, mock generation, member invite)
- [ ] `CommandPalette` (Cmd+K) returns results across specs, endpoints, mocks, and runs

### Phase 7 — Landing Page & Final Polish
- [ ] Landing page renders all sections from `pages_and_flows.md` §2 with no layout breakage at `--bp-md`, `--bp-lg`, `--bp-xl`
- [ ] All list views are paginated and show correct total counts
- [ ] No hardcoded colors/spacing remain outside `design_system.md` tokens (spot-check via grep for raw hex values in `app/components` and `app/routes`)
- [ ] Full E2E flow (sign up → workspace → upload spec → run validation → generate mock → view dashboard → generate report) passes via Playwright
