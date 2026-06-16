import { useState } from "react";
import { cn } from "#/lib/utils";

interface JsonViewerProps {
	data: unknown;
	defaultExpanded?: boolean;
	maxHeight?: string;
}

export function JsonViewer({
	data,
	defaultExpanded = false,
	maxHeight = "400px",
}: JsonViewerProps) {
	const formatted = JSON.stringify(data, null, 2);
	const [collapsed, setCollapsed] = useState(!defaultExpanded);

	return (
		<div className="relative group">
			<button
				type="button"
				onClick={() => setCollapsed(!collapsed)}
				className="absolute top-1 right-1 z-10 rounded px-1.5 py-0.5 text-[10px] text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
			>
				{collapsed ? "▶ Expand" : "▼ Collapse"}
			</button>
			{collapsed ? (
				<div
					className="rounded bg-muted p-3 text-xs font-mono overflow-hidden max-h-12 opacity-60 cursor-pointer"
					onClick={() => setCollapsed(false)}
				>
					<code>{formatted.slice(0, 120)}...</code>
				</div>
			) : (
				<pre
					className={cn(
						"rounded bg-muted p-3 text-xs font-mono overflow-auto",
						maxHeight && `max-h-[${maxHeight}]`,
					)}
				>
					<code>{formatted}</code>
				</pre>
			)}
		</div>
	);
}
