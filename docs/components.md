# Components — UI Inventory

Reusable component inventory beyond raw shadcn/ui primitives. Organized by `app/components/` subdirectory per `architecture.md`. All components follow `design_system.md` tokens.

---

## 1. `components/layout/`

### `AppSidebar`
- Props: `collapsed: boolean`, `onToggle: () => void`, `activeWorkspace`, `navItems`
- Renders logo, workspace switcher (dropdown using shadcn `DropdownMenu`), grouped nav links with active-state highlighting (left border accent in `--accent-blue`), collapse toggle
- Collapsed state: icon-only with tooltips

### `AppTopbar`
- Props: `title: string`, `breadcrumbs?: BreadcrumbItem[]`
- Contains: breadcrumb/title, `CommandPalette` trigger, `NotificationBell`, `UserMenu`

### `CommandPalette`
- Built on shadcn `Command` (cmdk)
- Triggered by Cmd+K, searches specs/endpoints/mocks/runs via debounced server function call
- Grouped results with icons per entity type

### `NotificationBell`
- Badge count of open critical/warning `drift_alert`s
- Popover with list of recent alerts, "View all" → `/drift`

### `UserMenu`
- Avatar + dropdown: account settings, theme toggle, sign out

### `WorkspaceSwitcher`
- Dropdown listing user's workspaces, "Create workspace" action at bottom

### `PageHeader`
- Props: `title`, `description?`, `actions?: ReactNode` (right-aligned buttons)
- Consistent page-level heading used across all dashboard pages

---

## 2. `components/editors/`

### `MonacoEditor` (wrapper)
- Props: `value`, `onChange?`, `language: 'json' | 'yaml'`, `readOnly?`, `height?`
- Configured with dark theme matching `--background-secondary`, JetBrains Mono font, custom theme rules mapping to design system syntax colors

### `JsonViewer`
- Props: `data: unknown`, `collapsed?: boolean | number` (depth), `searchable?: boolean`
- Built on `react-json-view-lite`, restyled to match `text-mono` tokens and syntax color palette
- Optional search/filter input above the tree

### `SchemaTreeViewer`
- Props: `schema: JSONSchema`, `highlightPath?: string`
- Recursive tree rendering of a JSON Schema: property name, type badge (`text-mono-sm`, `--accent-violet`), required indicator, format/enum/constraints shown as secondary text, expand/collapse per node
- Handles `oneOf`/`anyOf`/`allOf`/`$ref` (circular ref badge if detected)

### `DiffViewer`
- Props: `diff: DiffEntry[]`, `mode: 'unified' | 'side-by-side'`
- Renders added/removed/changed lines with color coding (`--success`/`--error`/`--warning` per `design_system.md` §7)
- Toggle between unified and side-by-side modes

### `CodeBlock`
- Props: `code: string`, `language: string`, `copyable?: boolean`
- Static syntax-highlighted block (Shiki or Monaco read-only) with copy-to-clipboard button

---

## 3. `components/validation/`

### `ValidationResultCard`
- Props: `result: ValidationResult`, `expanded?: boolean`, `onToggle?`
- Header: endpoint method+path badge, `StatusBadge` (pass/warning/fail), latency, status code
- Expandable body: tabs for "Violations", "Diff", "Request", "Response"

### `ViolationsList`
- Props: `violations: Violation[]`
- Grouped by severity (errors first, then warnings), each item shows path (`text-mono-sm`), message, expected vs. actual values

### `StatusBadge`
- Props: `status: 'pass' | 'warning' | 'fail' | 'info' | 'pending' | 'draft'`
- Pill badge per `design_system.md` §7 color mapping, with dot indicator

### `MethodBadge`
- Props: `method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD'`
- Color-coded per `design_system.md` §7 (Schema Trees section)

### `ValidationSummaryStats`
- Props: `{ total, passed, warnings, failed }`
- Horizontal stat row or stacked progress bar showing proportional pass/warning/fail

### `ValidationRunTimelineItem`
- Props: `run: ValidationRun`
- Used in `/validation` timeline view: trigger icon, spec name, timestamp, duration, `ValidationSummaryStats` (compact), `StatusBadge`

---

## 4. `components/specs/`

### `EndpointExplorer`
- Props: `endpoints: Endpoint[]`, `groupBy?: 'tag' | 'none'`, `onSelect: (endpointId) => void`, `searchable?: boolean`
- Tree/list grouped by tag, each row: `MethodBadge` + path (`text-mono`) + summary + deprecated badge if applicable
- Search input filters by path/operationId/summary

### `SpecCard`
- Props: `spec: Specification`
- Used in `/specs` grid view: name, version, `StatusBadge`, endpoint count, last validated date, monitored icon, actions menu

### `SpecUploadZone`
- Props: `onFileSelect: (file) => void`, `accept: string[]`
- Dashed-border drag-and-drop zone per `design_system.md` §7, shows upload progress/processing state

### `VersionComparisonView`
- Props: `comparison: VersionComparisonResult`
- Risk badge, three sections (added/removed/changed endpoints), each changed endpoint expandable showing field-level diffs with breaking/non-breaking tags

### `RequestSchemaPanel` / `ResponseSchemaPanel`
- Props: `schema: JSONSchema`, `statusCode?: string` (for response)
- Wraps `SchemaTreeViewer` with a header showing status code badge (response) or parameter location (request: path/query/header/body)

---

## 5. `components/mocks/`

### `MockCard`
- Props: `mock: MockDataset`
- `MethodBadge` + path, status code badge, variant type tag (color-coded: `example` = blue, `generated` = cyan, `custom` = violet, `edge_case` = warning, `error` = error), tags, pinned star icon, last updated

### `MockVariantSelector`
- Props: `selected: VariantType[]`, `onChange`
- Multi-select chips for generation modal (examples, generated, custom, multiple variants, edge cases, error responses)

### `MockGenerationModal`
- Props: `endpointId`, `onGenerated: (mocks) => void`
- Form: status code select, variant type selector (`MockVariantSelector`), count input (for "multiple variants"), custom rules editor (collapsible JSON/form), seed input (optional)

### `MockServingPanel`
- Props: `config: MockServeConfig`, `mockId`
- Enable/disable toggle, latency slider, header overrides table, public URL + copy `curl` button

### `GenerationRulesEditor`
- Props: `rules: GenerationRules`, `onChange`
- Form/JSON hybrid editor for `fieldOverrides`, `locale`, `arrayLength` per `features_spec.md` §4

---

## 6. `components/charts/`

### `TrendLineChart`
- Props: `data: { date: string; value: number }[]`, `label`, `color?`
- Recharts `LineChart` wrapper, styled per `design_system.md` §7 (grid, tooltip, axis styling)

### `ViolationsBarChart`
- Props: `data: { type: string; count: number }[]`
- Recharts `BarChart`, bars colored by severity mapping

### `StackedOutcomeBar`
- Props: `{ passed, warning, failed, total }`
- Horizontal stacked bar (success/warning/error colors) — used in `ValidationSummaryStats` and dashboard cards

### `StatCard`
- Props: `label`, `value`, `trend?: { value: number; direction: 'up' | 'down' }`, `icon?`
- Dashboard overview stat cards with optional trend indicator (green/red arrow)

---

## 7. `components/shared/`

### `EmptyState`
- Props: `icon`, `title`, `description`, `action?: { label, onClick }`
- Used across list pages (specs, mocks, reports, drift) when no data exists

### `SearchInput`
- Props: `value`, `onChange`, `placeholder?`
- Styled input with search icon, debounced

### `FilterBar`
- Props: `filters: FilterConfig[]`, `values`, `onChange`
- Horizontal row of select/dropdown filters + active filter chips with clear

### `Pagination`
- Props: `page`, `pageSize`, `total`, `onPageChange`
- Standard pagination control for `PaginatedResult<T>` responses

### `ConfirmDialog`
- Props: `title`, `description`, `confirmLabel`, `variant?: 'default' | 'destructive'`, `onConfirm`
- Wraps shadcn `AlertDialog` for destructive actions (delete spec, revoke key, etc.)

### `CopyButton`
- Props: `value: string`, `label?`
- Icon button that copies to clipboard with brief success state change

### `TagList` / `TagInput`
- Display and editable tag chips (used in mock library tags, comment entities)

### `GlassPanel`
- Props: `children`, `className?`
- Wrapper applying the `.glass-panel` style from `design_system.md` §6 — used for hero visualization, command palette, floating toolbars

### `GradientBorderCard`
- Props: `children`, `className?`
- Wrapper implementing the `gradient-border` technique for featured/highlighted cards

---

## 8. `components/team/`

### `MemberRow`
- Props: `member: Member`, `currentUserRole`
- Avatar, name, email, role select (role-gated), remove action

### `InviteMemberModal`
- Form: email input, role select, send invitation

### `AuditLogEntryRow`
- Props: `entry: AuditLogEntry`
- Timestamp, actor avatar+name, action label (formatted from `action` string), expandable metadata viewer (`JsonViewer`)

---

## 9. Landing Page Components (`components/landing/`)

### `HeroVisualization`
- Animated `GlassPanel` showing the pipeline: Spec icon → Response icon → Validation Engine (animated pulse) → Mock Output → `StatusBadge` (pass/fail cycling)
- Built with CSS animations / lightweight SVG, no heavy JS animation libraries needed

### `FeatureCard`
- Props: `icon`, `title`, `description`
- Used in core features grid

### `FeatureDeepDive`
- Props: `title`, `description`, `visual: ReactNode`, `reverse?: boolean` (alternates image/text order)

### `AdvancedFeatureItem`
- Props: `icon`, `title`, `description`
- Compact icon + text item for the advanced features strip

### `CTASection`
- Props: `headline`, `ctaLabel`, `ctaHref`
- Gradient background panel with centered content
