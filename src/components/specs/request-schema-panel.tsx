import { SchemaTreeViewer } from "./schema-tree-viewer";

export function RequestSchemaPanel({
	schema,
}: {
	schema: Record<string, unknown> | null;
}) {
	return (
		<div>
			<h4 className="mb-2 text-sm font-medium">Request Body</h4>
			<SchemaTreeViewer schema={schema} />
		</div>
	);
}
