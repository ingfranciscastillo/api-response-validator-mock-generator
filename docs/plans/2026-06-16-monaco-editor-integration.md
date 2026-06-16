# Monaco Editor Integration

**Date:** 2026-06-16
**Status:** Approved

## Goal

Replace the plain Textarea in the **Update Spec dialog** and the JsonViewer in the **Schema tab** with Monaco Editor for better syntax highlighting, editing, and search capabilities.

## Changes

### 1. Update Spec Dialog — Editable Monaco

| Before | After |
|--------|-------|
| `<Textarea>` with plain text | `<MonacoEditor>` with JSON/YAML syntax highlighting |
| No validation | Built-in JSON validation |
| No search | Ctrl+F search |

- Replace `<Label>` + `<Textarea>` block with `<MonacoEditor>`
- Same state: `updateSpecContent` string, `setUpdateSpecContent` callback
- `language="json"`, `height="300px"`, `minimap={false}`

### 2. Schema Tab — Read-only Monaco

| Before | After |
|--------|-------|
| `<JsonViewer>` tree view | `<MonacoEditor>` read-only with syntax highlighting |
| Collapsible tree navigation | Code folding + search |
| Limited to JSON | Can display JSON/YAML |

- Serialize `schemaData` to formatted JSON: `JSON.stringify(schemaData, null, 2)`
- `readOnly={true}`, `height="500px"`, `minimap={true}`
- Keep loading state and "no data" fallback

### 3. Imports

- Add: `import { MonacoEditor } from "#/components/editors/monaco-editor"`
- Remove: `import { JsonViewer } from "#/components/shared/json-viewer"`

## Files

- `src/routes/dashboard/specs/$specId/index.tsx` — both replacements
