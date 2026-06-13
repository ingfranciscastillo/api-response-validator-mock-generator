# API Specification — Server Functions & Routes

Internal application logic is implemented as **TanStack Start server functions** (type-safe, called directly from route loaders/components via TanStack Query). A small set of `/api/*` HTTP routes exist for Better Auth, Inngest, and the public mock-serving API consumed by external clients (CI/CD, etc.).

All server functions are workspace-scoped: they receive the active `workspaceId` from session context and enforce membership/role checks per `auth_and_permissions.md`. All inputs/outputs validated with Zod (generated via `drizzle-zod` where applicable).

---

## 1. Workspaces (`app/server/functions/workspaces.ts`)

| Function | Input | Output | Notes |
|---|---|---|---|
| `getCurrentWorkspace` | — | `Workspace` | from session |
| `listWorkspaces` | — | `Workspace[]` | for workspace switcher |
| `createWorkspace` | `{ name, slug }` | `Workspace` | |
| `updateWorkspace` | `{ workspaceId, name?, logo? }` | `Workspace` | role: `owner`/`admin` |
| `inviteMember` | `{ email, role }` | `Invitation` | role: `owner`/`admin` |
| `listMembers` | — | `Member[]` | |
| `updateMemberRole` | `{ memberId, role }` | `Member` | role: `owner` |
| `removeMember` | `{ memberId }` | `void` | role: `owner`/`admin` |
| `createApiKey` | `{ name, scopes, expiresAt? }` | `{ apiKey: string, record: ApiKey }` | raw key shown once |
| `listApiKeys` | — | `ApiKey[]` | (excludes hash) |
| `revokeApiKey` | `{ apiKeyId }` | `void` | |

---

## 2. Specifications (`app/server/functions/specs.ts`)

| Function | Input | Output | Notes |
|---|---|---|---|
| `listSpecifications` | `{ status?, search?, page?, pageSize? }` | `PaginatedResult<Specification>` | |
| `getSpecification` | `{ specId }` | `Specification & { endpoints: Endpoint[] }` | |
| `createSpecificationFromUpload` | `{ fileContent: string, fileName, format }` | `Specification` | triggers parse pipeline |
| `createSpecificationFromPaste` | `{ rawText: string, name }` | `Specification` | |
| `createSpecificationFromUrl` | `{ url: string, name }` | `Specification` | server-side fetch |
| `reprocessSpecification` | `{ specId }` | `Specification` | re-run parse/dereference |
| `updateSpecification` | `{ specId, name?, description?, isMonitored?, monitoredBaseUrl? }` | `Specification` | |
| `archiveSpecification` | `{ specId }` | `void` | soft delete |
| `deleteSpecification` | `{ specId }` | `void` | role: `owner`/`admin`, hard delete |
| `getEndpoint` | `{ endpointId }` | `Endpoint` | includes resolved request/response schemas |
| `listEndpoints` | `{ specId, tag?, method?, search? }` | `Endpoint[]` | for endpoint explorer |
| `createSpecificationVersion` | `{ specId, fileContent?, rawText?, versionLabel }` | `SpecificationVersion` | snapshot for comparison |
| `listSpecificationVersions` | `{ specId }` | `SpecificationVersion[]` | |
| `compareSpecificationVersions` | `{ specId, fromVersionId, toVersionId }` | `VersionComparisonResult` | see `features_spec.md` §9 |

---

## 3. Validation (`app/server/functions/validation.ts`)

| Function | Input | Output | Notes |
|---|---|---|---|
| `sendTestRequest` | `{ specId, endpointId, request: RequestConfig }` | `{ response: ResponseSnapshot, latencyMs }` | server-side fetch (Testing Workspace) |
| `validateResponse` | `{ endpointId, response: ResponseSnapshot, statusCode }` | `ValidationResultDetail` | runs Ajv engine, no persistence |
| `runValidation` | `{ specId, endpointId, request: RequestConfig, save: boolean }` | `{ validationRunId, result: ValidationResultDetail }` | sends request, validates, optionally persists as `validation_run` + `validation_result` |
| `runBulkValidation` | `{ specId, endpointIds?: string[] }` | `{ validationRunId }` | triggers async run across multiple endpoints (queued via Inngest for >10 endpoints) |
| `listValidationRuns` | `{ specId?, status?, triggerType?, dateRange?, page?, pageSize? }` | `PaginatedResult<ValidationRun>` | timeline view |
| `getValidationRun` | `{ runId }` | `ValidationRun & { results: ValidationResult[] }` | |
| `getValidationResult` | `{ resultId }` | `ValidationResult` | full detail incl. diff/violations |
| `generateTestDatasetFromResult` | `{ resultId, name? }` | `MockDataset` | persists response as a `custom` mock |

### `RequestConfig` shape
```ts
{
  method: string;
  path: string; // with path params interpolated
  queryParams?: Record<string, string>;
  headers?: Record<string, string>;
  body?: unknown;
  auth?: { type: 'bearer' | 'apiKey' | 'basic'; value: string; headerName?: string };
}
```

### `ResponseSnapshot` shape
```ts
{
  statusCode: number;
  headers: Record<string, string>;
  body: unknown;
}
```

---

## 4. Mock Generation (`app/server/functions/mocks.ts`)

| Function | Input | Output | Notes |
|---|---|---|---|
| `generateMock` | `{ endpointId, statusCode, variantType, variantLabel?, generationRules?, seed? }` | `MockDataset` | core generation, single mock |
| `generateMockVariants` | `{ endpointId, statusCode, count, variantType }` | `MockDataset[]` | multiple seeds |
| `generateEdgeCaseMocks` | `{ endpointId, statusCode }` | `MockDataset[]` | empty, boundary, null variants |
| `generateErrorMocks` | `{ endpointId }` | `MockDataset[]` | one per non-2xx status in spec |
| `regenerateMock` | `{ mockId, seed?, generationRules? }` | `MockDataset` | overwrites payload |
| `listMocks` | `{ specId?, endpointId?, variantType?, tags?, search?, page?, pageSize? }` | `PaginatedResult<MockDataset>` | mock library |
| `getMock` | `{ mockId }` | `MockDataset` | |
| `updateMock` | `{ mockId, name?, tags?, isPinned?, payload? }` | `MockDataset` | manual edits to payload allowed |
| `deleteMock` | `{ mockId }` | `void` | soft delete |
| `configureMockServing` | `{ mockId, isEnabled, latencyMs?, responseHeadersOverride? }` | `MockServeConfig` | |

---

## 5. Reports (`app/server/functions/reports.ts`)

| Function | Input | Output | Notes |
|---|---|---|---|
| `generateReport` | `{ specId?, reportType, dateRangeStart?, dateRangeEnd?, validationRunIds? }` | `Report` | runs aggregation + renders HTML/PDF/JSON |
| `listReports` | `{ specId?, reportType?, page?, pageSize? }` | `PaginatedResult<Report>` | |
| `getReport` | `{ reportId }` | `Report & { htmlUrl, pdfUrl, jsonUrl }` | signed R2 URLs |
| `deleteReport` | `{ reportId }` | `void` | |

---

## 6. Drift & Alerts (`app/server/functions/drift.ts`)

| Function | Input | Output | Notes |
|---|---|---|---|
| `configureDriftCheck` | `{ specId, isEnabled, schedule?, monitoredBaseUrl? }` | `DriftCheck` | |
| `getDriftCheck` | `{ specId }` | `DriftCheck \| null` | |
| `triggerManualDriftCheck` | `{ specId }` | `{ validationRunId }` | runs immediately (sync for small specs, Inngest for large) |
| `listDriftAlerts` | `{ specId?, status?, severity?, alertType?, page?, pageSize? }` | `PaginatedResult<DriftAlert>` | |
| `getDriftAlert` | `{ alertId }` | `DriftAlert` | |
| `updateDriftAlertStatus` | `{ alertId, status: 'acknowledged' \| 'resolved' \| 'ignored' }` | `DriftAlert` | |
| `configureNotificationChannel` | `{ channelType, target, events }` | `NotificationChannel` | |
| `listNotificationChannels` | — | `NotificationChannel[]` | |
| `deleteNotificationChannel` | `{ channelId }` | `void` | |

---

## 7. Collaboration & Audit (`app/server/functions/audit.ts`)

| Function | Input | Output | Notes |
|---|---|---|---|
| `listComments` | `{ entityType, entityId }` | `Comment[]` | |
| `createComment` | `{ entityType, entityId, body }` | `Comment` | writes audit log entry |
| `deleteComment` | `{ commentId }` | `void` | author or `owner`/`admin` |
| `listAuditLog` | `{ entityType?, entityId?, actorId?, action?, dateRange?, page?, pageSize? }` | `PaginatedResult<AuditLogEntry>` | role: `owner`/`admin` |

---

## 8. Dashboard (`app/server/functions/dashboard.ts`)

| Function | Input | Output | Notes |
|---|---|---|---|
| `getDashboardOverview` | `{ dateRange?: { start, end } }` | `DashboardOverview` | aggregated metrics, see `features_spec.md` §12 |
| `getDashboardCharts` | `{ dateRange?, granularity?: 'day' \| 'week' }` | `{ successRateTrend, violationsByType, validationVolume }` | for recharts |

---

## 9. HTTP API Routes (`app/routes/api/`)

### `app/routes/api/auth/$.ts`
Better Auth catch-all handler — handles `/api/auth/*` (sign-in, sign-up, OAuth callbacks, session, organization endpoints).

### `app/routes/api/webhooks/drift.ts`
- `POST /api/webhooks/drift` — Inngest function invocation endpoint (drift-check cron, breaking-change-alert dispatch). Verified via Inngest signing key.

### `app/routes/api/public/mocks/$mockId.ts`
Public mock-serving endpoint for external consumers (CI pipelines, frontend dev servers).

- `GET /api/public/mocks/:mockId`
  - **Auth:** `Authorization: Bearer <api_key>` — must have `mocks:read` scope
  - **Behavior:**
    1. Look up `mock_dataset` by ID, verify `workspace_id` matches the API key's workspace
    2. Check `mock_serve_config.is_enabled`; return `404` if disabled or missing
    3. Apply `latencyMs` delay if configured
    4. Return `payload` as JSON body, status `mock_dataset.status_code`, with `response_headers_override` merged into response headers
  - **Errors:** `401` (invalid/missing key), `403` (key lacks scope or wrong workspace), `404` (mock not found or serving disabled)

### `app/routes/api/public/validation-runs.ts` (CI integration)
- `POST /api/public/validation-runs`
  - **Auth:** `Authorization: Bearer <api_key>` — must have `validation:write` scope
  - **Body:** `{ specId, endpointId, request: RequestConfig }` or batch array
  - **Behavior:** equivalent to `runValidation` with `trigger_type: 'api'`, persists results
  - **Response:** `{ validationRunId, summary: { total, passed, warnings, failed } }`
  - Used for CI pipelines to fail builds on contract violations (non-zero exit determined by consumer based on `failed > 0`)

---

## 10. Common Types

```ts
type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

type ValidationResultDetail = {
  outcome: 'pass' | 'warning' | 'fail';
  violations: Violation[];
  diff: DiffEntry[];
  responseSnapshot: ResponseSnapshot;
};

type Violation = {
  type: 'type_mismatch' | 'missing_required' | 'extra_field' | 'enum_violation' | 'format_invalid' | 'null_not_allowed' | 'array_item_invalid';
  path: string;
  expected?: string;
  actual?: string;
  message: string;
  severity: 'warning' | 'error';
};

type DiffEntry = {
  type: 'CREATE' | 'REMOVE' | 'CHANGE';
  path: (string | number)[];
  value?: unknown;
  oldValue?: unknown;
};
```

---

## 11. Error Handling Convention

All server functions throw typed errors caught by a shared error boundary:

```ts
class AppError extends Error {
  constructor(
    public code: 'NOT_FOUND' | 'FORBIDDEN' | 'VALIDATION_ERROR' | 'CONFLICT' | 'INTERNAL',
    message: string,
    public details?: unknown
  ) { super(message); }
}
```

- `NOT_FOUND` → 404-equivalent UI state (empty/error page)
- `FORBIDDEN` → permission denied toast, no data leak
- `VALIDATION_ERROR` → inline form errors (Zod issue paths mapped to fields)
- `CONFLICT` → e.g., duplicate slug, shown as toast
- `INTERNAL` → generic error toast + logged server-side
