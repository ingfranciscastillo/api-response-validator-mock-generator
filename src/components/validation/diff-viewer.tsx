import { cn } from "#/lib/utils";

interface DiffItem {
	type: "CREATE" | "REMOVE" | "CHANGE";
	path: string;
	value?: unknown;
	oldValue?: unknown;
	breaking: boolean;
	category: string;
}

export function DiffViewer({ entries }: { entries: DiffItem[] }) {
	if (entries.length === 0) {
		return (
			<div className="text-sm text-muted-foreground italic py-2">
				No differences
			</div>
		);
	}

	return (
		<div className="space-y-1">
			{entries.map((entry, i) => {
				const isCreate = entry.type === "CREATE";
				const isRemove = entry.type === "REMOVE";
				const isChange = entry.type === "CHANGE";

				return (
					<div
						key={i}
						className={cn(
							"rounded border-l-2 px-3 py-2 text-sm",
							isCreate && "bg-green-500/10 border-l-green-500",
							isRemove && "bg-red-500/10 border-l-red-500",
							isChange && "bg-amber-500/10 border-l-amber-500",
						)}
					>
						<div className="flex items-center gap-2">
							<span
								className={cn(
									"text-[10px] font-semibold uppercase tracking-wider",
									isCreate && "text-green-600 dark:text-green-400",
									isRemove && "text-red-500",
									isChange && "text-amber-600 dark:text-amber-400",
								)}
							>
								{entry.type}
							</span>
							<code className="text-xs font-mono text-foreground/80">
								{entry.path}
							</code>
							{entry.breaking && (
								<span className="text-[10px] font-semibold text-red-500 bg-red-500/10 rounded px-1 py-0">
									breaking
								</span>
							)}
							<span className="text-[10px] text-muted-foreground ml-auto">
								{entry.category}
							</span>
						</div>
						{(isChange || isRemove) && entry.oldValue !== undefined && (
							<div className="mt-1 text-xs text-red-500 line-through">
								{formatValue(entry.oldValue)}
							</div>
						)}
						{(isChange || isCreate) && entry.value !== undefined && (
							<div className="mt-0.5 text-xs text-green-600 dark:text-green-400">
								{formatValue(entry.value)}
							</div>
						)}
					</div>
				);
			})}
		</div>
	);
}

function formatValue(value: unknown): string {
	if (value === null) return "null";
	if (value === undefined) return "undefined";
	if (typeof value === "string") return `"${value}"`;
	if (typeof value === "object") return JSON.stringify(value);
	return String(value);
}
