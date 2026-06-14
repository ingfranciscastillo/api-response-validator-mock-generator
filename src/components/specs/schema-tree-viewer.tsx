import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

import { cn } from "#/lib/utils";

type SchemaNode =
	| Record<string, unknown>
	| Array<unknown>
	| string
	| number
	| boolean
	| null;

function getTypeLabel(value: unknown): string {
	if (value === null) return "null";
	if (Array.isArray(value)) return "array";
	return typeof value;
}

function getTypeColor(type: string): string {
	switch (type) {
		case "string":
			return "text-green-600 dark:text-green-400";
		case "number":
		case "integer":
			return "text-blue-600 dark:text-blue-400";
		case "boolean":
			return "text-orange-600 dark:text-orange-400";
		case "array":
			return "text-purple-600 dark:text-purple-400";
		case "object":
			return "text-cyan-600 dark:text-cyan-400";
		default:
			return "text-muted-foreground";
	}
}

function SchemaProperty({
	name,
	schema,
	required,
	depth = 0,
}: {
	name?: string;
	schema: SchemaNode;
	required?: boolean;
	depth?: number;
}) {
	const [expanded, setExpanded] = useState(depth < 2);
	const isObject =
		schema !== null && typeof schema === "object" && !Array.isArray(schema);
	const isArray = Array.isArray(schema);
	const isExpandable = isObject || isArray;
	const type = getTypeLabel(schema);

	return (
		<div>
			<button
				type="button"
				onClick={() => isExpandable && setExpanded(!expanded)}
				className={cn(
					"flex w-full items-center gap-1.5 rounded-sm px-1 py-0.5 text-left text-sm hover:bg-muted/50",
					isExpandable ? "cursor-pointer" : "cursor-default",
				)}
				style={{ paddingLeft: `${depth * 16 + 4}px` }}
			>
				{isExpandable ? (
					expanded ? (
						<ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
					) : (
						<ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
					)
				) : (
					<span className="size-3.5 shrink-0" />
				)}
				{name && (
					<>
						<span className="font-medium">{name}</span>
						{required !== undefined && (
							<span className="text-xs text-muted-foreground">
								{required ? "(required)" : "(optional)"}
							</span>
						)}
					</>
				)}
				{!isExpandable && (
					<>
						<span className={cn("text-xs font-mono", getTypeColor(type))}>
							{type}
						</span>
						{schema !== null && type !== "object" && type !== "array" && (
							<span className="text-xs text-muted-foreground">
								: {String(schema)}
							</span>
						)}
					</>
				)}
				{isExpandable && (
					<span className={cn("ml-auto text-xs font-mono", getTypeColor(type))}>
						{isObject
							? `{ ${Object.keys(schema as Record<string, unknown>).length} }`
							: `[ ${(schema as Array<unknown>).length} ]`}
					</span>
				)}
			</button>
			{isExpandable && expanded && (
				<>
					{isObject &&
						Object.entries(schema as Record<string, unknown>).map(
							([key, value]) => (
								<SchemaProperty
									key={key}
									name={key}
									schema={value as SchemaNode}
									depth={depth + 1}
								/>
							),
						)}
					{isArray && (schema as Array<unknown>).length > 0 && (
						<SchemaProperty
							name="0"
							schema={(schema as Array<unknown>)[0] as SchemaNode}
							depth={depth + 1}
						/>
					)}
				</>
			)}
		</div>
	);
}

export function SchemaTreeViewer({
	schema,
	title,
}: {
	schema: Record<string, unknown> | null;
	title?: string;
}) {
	if (!schema || Object.keys(schema).length === 0) {
		return (
			<div className="text-sm text-muted-foreground italic px-1 py-2">
				No schema
			</div>
		);
	}

	return (
		<div className="rounded-md border p-3">
			{title && (
				<h4 className="mb-2 text-sm font-medium text-muted-foreground">
					{title}
				</h4>
			)}
			<SchemaProperty schema={schema as SchemaNode} />
		</div>
	);
}
