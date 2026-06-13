# Coding Standards — API Response Validator & Mock Generator

Conventions for writing code in this repository. Applies to all TypeScript/TSX files unless a more specific rule is noted.

---

## 1. General TypeScript

- **Strict mode** — `tsconfig.json` has `strict: true`; no `any` unless interfacing with an untyped third-party library, and even then prefer `unknown` + narrowing
- **No implicit `any`** — all function params, return types on exported functions, and module boundaries are explicitly typed
- **Prefer `type` over `interface`** for data shapes; use `interface` only when declaration merging is needed (rare)
- **Discriminated unions** for variant data (e.g., `Violation['type']`, `DiffEntry['type']`, `MockDataset['variant_type']`) — avoid optional-field "kitchen sink" types
- **No enums** — use string literal unions + `as const` objects where a value list is needed at runtime
- **Avoid non-null assertions (`!`)** — handle the `null`/`undefined` case or throw an explicit `AppError`

```ts
// Good
type Violation = {
  type: 'type_mismatch' | 'missing_required' | 'extra_field';
  path: string;
  severity: 'warning' | 'error';
};

// Avoid
type Violation = {
  type: string;
  path?: string;
  severity?: string;
};
```

---

## 2. File & Folder Naming

- **Files:** `kebab-case.ts` / `kebab-case.tsx` (e.g., `validation-result-card.tsx`, `version-diff.ts`)
- **Components:** `PascalCase` export name, file name in `kebab-case` matching the component (e.g., `status-badge.tsx` exports `StatusBadge`)
- **Server functions:** grouped by domain in `app/server/functions/{domain}.ts`, one file per domain from `api_spec.md`
- **Drizzle schema files:** one per domain per `database.md` §11 (e.g., `specs.ts`, `mocks.ts`)
- **Routes:** follow TanStack Start file-based routing conventions exactly as laid out in `architecture.md` §4 — don't restructure the route tree without updating `pages_and_flows.md`
- **Test files:** colocated as `*.test.ts` next to the file under test, or in `__tests__/` for integration/E2E suites

---

## 3. Imports & Module Boundaries

- **Absolute imports** via path aliases (`@/components/...`, `@/server/...`, `@/lib/...`) — configure in `tsconfig.json` and `vite.config.ts`
- **No deep imports into another domain's internals** — e.g., UI components import server function results via typed return values, not by importing Drizzle schema objects directly into client code
- **Barrel files (`index.ts`)** used sparingly — only for `app/server/db/schema/index.ts` (re-export all tables/relations) and `components/ui/index.ts` (shadcn re-exports), if helpful. Avoid barrels that cause circular imports
- Server-only code (`app/server/**`) must never be imported into client components directly — only via server functions (TanStack Start enforces this boundary, but keep imports clean to avoid accidental bundling)

---

## 4. React Components

- **Function components only**, no class components
- **Default to server components / loader data** where TanStack Start patterns allow; use `'use client'`-equivalent patterns only when interactivity requires it
- **Props typing:**
```tsx
type StatusBadgeProps = {
  status: 'pass' | 'warning' | 'fail' | 'info' | 'pending' | 'draft';
  className?: string;
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  // ...
}
```
- **No default exports** for components — always named exports (improves refactor safety and import consistency)
- **Composition over configuration** — prefer composable components (e.g., `Card`, `CardHeader`, `CardContent` from shadcn) over a single component with many boolean props
- **Co-locate small subcomponents** in the same file if they're only used by the parent and under ~30 lines; extract to their own file otherwise

---

## 5. Styling

- **Tailwind utility classes** as the default; use `cn()` (clsx + tailwind-merge, shadcn convention) for conditional classes
- **No inline `style={}`** except for truly dynamic values that can't be expressed as Tailwind classes (e.g., chart colors computed at runtime)
- **Use design tokens** (`design_system.md`) via Tailwind theme extensions — e.g., `bg-surface`, `text-text-secondary`, `border-border-subtle`, `rounded-lg`, `shadow-glow-blue` — never raw hex values or arbitrary px values in `className`
- **Variant styling** via `class-variance-authority` (cva) for components with multiple visual variants (buttons, badges), following shadcn conventions

---

## 6. Server Functions

- One server function = one exported async function per `api_spec.md` entry
- **Input validation:** every server function validates its input with a Zod schema (often derived via `drizzle-zod`) before touching the database
- **Authorization first:** resolve session/workspace/role and call `requireRole(...)` before any data access (see `auth_and_permissions.md` §6)
- **Error handling:** throw `AppError` subclasses with the codes defined in `api_spec.md` §11 — never return raw error objects or `null` to signal failure ambiguously
- **Shape:**
```ts
export const createSpecificationFromPaste = createServerFn({ method: 'POST' })
  .validator(createSpecFromPasteSchema)
  .handler(async ({ data, context }) => {
    const { workspaceId, user } = await requireRole(context, ['owner', 'admin', 'editor']);

    // business logic via services/

    return result;
  });
```
- **Business logic lives in `app/server/services/`**, not inline in server functions — server functions orchestrate (auth check → call service → persist → return), services contain the actual algorithms (validation engine, mock generator, diff engine, etc.)

---

## 7. Database / Drizzle

- **Schema definitions** use Drizzle's `pgTable`, with explicit column types (no relying on inference for non-obvious types)
- **Every table:** `id` (text, PK), `created_at` (timestamp, default `now()`), `updated_at` where mutable, `workspace_id` FK (except auth tables) — see `database.md`
- **Relations:** define `relations()` for every FK so `db.query.X.findMany({ with: { Y: true } })` works
- **Queries:** use the query builder (`db.query.*` or `db.select()...`) — avoid raw SQL (`sql\`...\``) except for operations Drizzle can't express cleanly (document why inline)
- **Transactions:** wrap multi-table writes (e.g., creating a `validation_run` + multiple `validation_result` rows, or generating a mock + its `mock_serve_config`) in `db.transaction(...)`
- **Workspace scoping helper:** all queries go through a helper that injects `.where(eq(table.workspaceId, workspaceId))` — never write a raw `db.select().from(specification)` without this filter in application code

---

## 8. Validation Engine & Algorithmic Code (`app/server/services/`)

This is the highest-risk-of-bugs area — extra rigor applies:

- **Pure functions where possible** — `validateResponse(schema, response): ValidationResultDetail` should not have side effects; persistence happens in the calling server function
- **Exhaustive switch statements** for discriminated unions (violation types, diff types, variant types) — use a `never` check in the `default` case so new union members cause a compile error if unhandled:
```ts
function describeViolation(v: Violation): string {
  switch (v.type) {
    case 'type_mismatch': return `...`;
    case 'missing_required': return `...`;
    // ...
    default: {
      const _exhaustive: never = v.type;
      throw new Error(`Unhandled violation type: ${_exhaustive}`);
    }
  }
}
```
- **Document edge cases inline** with comments referencing `features_spec.md` section numbers when the logic implements a specific rule (e.g., `// see features_spec.md §2 — additionalProperties: false => error`)
- **Deterministic output** — given the same schema + response + seed, output must be identical (critical for mock regeneration and test snapshots)

---

## 9. Testing Conventions

- **Unit tests:** `*.test.ts` colocated with the module, using Vitest
- **Naming:** `describe('validateResponse', () => { it('flags missing required field as fail', () => {...}) })` — test names describe behavior, not implementation
- **Fixtures:** sample OpenAPI specs and response payloads live in `app/server/services/__fixtures__/` (e.g., `petstore.json`, `responses/valid-pet.json`, `responses/missing-required-field.json`)
- **Snapshot tests** acceptable for mock generation output (with fixed seeds) and report HTML rendering — review snapshot diffs carefully on change
- **Integration tests** for server functions hit a test Neon branch (or local pg) and are cleaned up via transaction rollback or per-test schema reset

---

## 10. Comments & Documentation

- Comment **why**, not **what** — code should be self-explanatory for "what"; comments explain non-obvious business rules, trade-offs, or references to spec sections
- Exported functions/types in `services/` and `functions/` get a one-line JSDoc summary; complex algorithms (diff categorization, drift comparison) get a short block comment explaining the approach
- No commented-out code committed — delete it (git history preserves it)

---

## 11. Formatting & Linting

- **Prettier** — default config (2-space indent, single quotes, trailing commas `all`, semicolons on), run via `pnpm format`
- **ESLint** — TypeScript + React + Tailwind plugins; `pnpm lint` must pass with zero errors before a change is considered complete (warnings reviewed case-by-case)
- Run `pnpm typecheck` before considering any task complete — no `// @ts-ignore` without a comment explaining why and a linked follow-up if it's a temporary workaround

---

## 12. Accessibility

- All interactive elements keyboard-navigable (shadcn primitives handle most of this — don't override focus management)
- Color is never the sole indicator of status — `StatusBadge` always pairs color with text/icon (per `design_system.md`)
- Form inputs have associated labels (`<Label>` from shadcn); icon-only buttons have `aria-label`
