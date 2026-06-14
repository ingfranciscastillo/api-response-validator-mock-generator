import { Badge } from "#/components/ui/badge";
import { SchemaTreeViewer } from "./schema-tree-viewer";

export function ResponseSchemaPanel({
	schema,
	statusCode,
	description,
}: {
	schema: Record<string, unknown> | null;
	statusCode: string;
	description?: string;
}) {
	return (
		<div className="rounded-md border p-3">
			<div className="mb-2 flex items-center gap-2">
				<Badge
					variant={
						statusCode.startsWith("2")
							? "default"
							: statusCode.startsWith("4") || statusCode.startsWith("5")
								? "destructive"
								: "secondary"
					}
				>
					{statusCode}
				</Badge>
				{description && (
					<span className="text-xs text-muted-foreground">{description}</span>
				)}
			</div>
			<SchemaTreeViewer schema={schema} />
		</div>
	);
}

export function extractSchema(
	response: Record<string, unknown>,
): Record<string, unknown> | null {
	const content = response.content as Record<string, unknown> | undefined;
	if (!content) return null;
	const jsonContent = content["application/json"] as
		| Record<string, unknown>
		| undefined;
	if (!jsonContent) return null;
	return (jsonContent.schema as Record<string, unknown>) ?? null;
}
