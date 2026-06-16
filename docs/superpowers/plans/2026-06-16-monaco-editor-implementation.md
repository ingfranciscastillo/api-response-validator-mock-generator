# Monaco Editor Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Textarea (Update Spec dialog) and JsonViewer (Schema tab) with Monaco Editor for syntax highlighting, search, and editing.

**Architecture:** Drop-in replacement of two UI components in the spec detail page. MonacoEditor component already exists at `src/components/editors/monaco-editor.tsx`.

**Tech Stack:** `@monaco-editor/react` (already installed), React 19, Tailwind CSS v4

---

### Task 1: Swap imports in spec detail page

**Files:**
- Modify: `src/routes/dashboard/specs/$specId/index.tsx:14,28`

- [ ] **Step 1: Update imports**

Add `MonacoEditor` import and remove `JsonViewer`:

```tsx
// Remove:
import { JsonViewer } from "#/components/shared/json-viewer";

// Add:
import { MonacoEditor } from "#/components/editors/monaco-editor";

// Keep these (still used elsewhere in the page):
// Badge, Button, Dialog*, Input, Label, Switch, Tabs*, Textarea
```

- [ ] **Step 2: Run lint to verify imports compile**

Run: `pnpm check`
Expected: No errors related to imports

- [ ] **Step 3: Commit**

```bash
git add src/routes/dashboard/specs/\$specId/index.tsx
git commit -m "chore: swap JsonViewer for MonacoEditor import"
```

### Task 2: Replace Textarea with MonacoEditor in Update Spec dialog

**Files:**
- Modify: `src/routes/dashboard/specs/$specId/index.tsx:458-468`

- [ ] **Step 1: Replace Textarea block with MonacoEditor**

Current code (lines 458-468):
```tsx
{updateSpecMethod === "paste" ? (
  <div className="grid gap-2">
    <Label htmlFor="spec-content">Spec Content (JSON/YAML)</Label>
    <Textarea
      id="spec-content"
      placeholder="Paste your OpenAPI spec here..."
      className="min-h-[200px] font-mono text-xs"
      value={updateSpecContent}
      onChange={(e) => setUpdateSpecContent(e.target.value)}
    />
  </div>
) : (
```

Replace with:
```tsx
{updateSpecMethod === "paste" ? (
  <div className="grid gap-2">
    <Label htmlFor="spec-content">Spec Content (JSON/YAML)</Label>
    <MonacoEditor
      value={updateSpecContent}
      onChange={setUpdateSpecContent}
      language="json"
      height="300px"
    />
  </div>
) : (
```

- [ ] **Step 2: Remove unused Label and Textarea imports** (if they become unused)

Label is still used for the URL input method. Textarea becomes unused — remove it.

Remove line:
```tsx
import { Textarea } from "#/components/ui/textarea";
```

- [ ] **Step 3: Run typecheck to verify**

Run: `pnpm check`
Expected: Clean output

- [ ] **Step 4: Commit**

```bash
git add src/routes/dashboard/specs/\$specId/index.tsx
git commit -m "feat: replace Textarea with MonacoEditor in Update Spec dialog"
```

### Task 3: Replace JsonViewer with MonacoEditor in Schema tab

**Files:**
- Modify: `src/routes/dashboard/specs/$specId/index.tsx:347-361`

- [ ] **Step 1: Replace JsonViewer with read-only MonacoEditor**

Current code (lines 347-361):
```tsx
<TabsContent value="schema">
  <div className="rounded-md border">
    {schemaLoading ? (
      <div className="p-4 text-center text-sm text-muted-foreground">
        Loading schema...
      </div>
    ) : schemaData ? (
      <JsonViewer data={schemaData} />
    ) : (
      <div className="p-4 text-center text-sm text-muted-foreground">
        No schema data available
      </div>
    )}
  </div>
</TabsContent>
```

Replace with:
```tsx
<TabsContent value="schema">
  <div className="rounded-md border">
    {schemaLoading ? (
      <div className="p-4 text-center text-sm text-muted-foreground">
        Loading schema...
      </div>
    ) : schemaData ? (
      <MonacoEditor
        value={JSON.stringify(schemaData, null, 2)}
        language="json"
        readOnly={true}
        height="500px"
        minimap={true}
      />
    ) : (
      <div className="p-4 text-center text-sm text-muted-foreground">
        No schema data available
      </div>
    )}
  </div>
</TabsContent>
```

- [ ] **Step 2: Run typecheck to verify**

Run: `pnpm check`
Expected: Clean output

- [ ] **Step 3: Commit**

```bash
git add src/routes/dashboard/specs/\$specId/index.tsx
git commit -m "feat: replace JsonViewer with MonacoEditor in Schema tab"
```

### Task 4: Final cleanup and verify

- [ ] **Step 1: Remove unused JsonViewer import** (if not already removed in Task 1)

```tsx
// Remove this line if still present:
import { JsonViewer } from "#/components/shared/json-viewer";
```

- [ ] **Step 2: Run full check**

Run: `pnpm check`
Expected: Clean output with no errors

- [ ] **Step 3: Final commit**

```bash
git add src/routes/dashboard/specs/\$specId/index.tsx
git commit -m "chore: remove unused JsonViewer import"
```
