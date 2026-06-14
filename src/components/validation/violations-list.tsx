import { Badge } from "#/components/ui/badge";
import { cn } from "#/lib/utils";

interface ViolationItem {
	type: string;
	path: string;
	expected?: string;
	actual?: string;
	message: string;
	severity: "warning" | "error";
}

export function ViolationsList({
	violations,
}: {
	violations: ViolationItem[];
}) {
	if (violations.length === 0) {
		return (
			<div className="text-sm text-muted-foreground italic py-2">
				No violations
			</div>
		);
	}

	const errors = violations.filter((v) => v.severity === "error");
	const warnings = violations.filter((v) => v.severity === "warning");

	return (
		<div className="space-y-3">
			{errors.length > 0 && (
				<div>
					<h5 className="text-xs font-medium text-red-500 mb-1.5">
						Errors ({errors.length})
					</h5>
					<div className="space-y-1">
						{errors.map((v, i) => (
							<ViolationRow key={i} violation={v} />
						))}
					</div>
				</div>
			)}
			{warnings.length > 0 && (
				<div>
					<h5 className="text-xs font-medium text-amber-500 mb-1.5">
						Warnings ({warnings.length})
					</h5>
					<div className="space-y-1">
						{warnings.map((v, i) => (
							<ViolationRow key={i} violation={v} />
						))}
					</div>
				</div>
			)}
		</div>
	);
}

function ViolationRow({ violation }: { violation: ViolationItem }) {
	const bgColor =
		violation.severity === "error"
			? "bg-red-500/10 border-l-red-500"
			: "bg-amber-500/10 border-l-amber-500";

	return (
		<div className={cn("rounded border-l-2 px-3 py-2 text-sm", bgColor)}>
			<div className="flex items-start justify-between gap-2">
				<code className="text-xs font-mono text-foreground/80">
					{violation.path}
				</code>
				<Badge
					variant={violation.severity === "error" ? "destructive" : "secondary"}
					className="shrink-0 text-[10px] px-1.5 py-0"
				>
					{violation.type}
				</Badge>
			</div>
			<p className="text-xs text-muted-foreground mt-0.5">
				{violation.message}
			</p>
			{violation.expected && violation.actual && (
				<div className="flex items-center gap-2 mt-1 text-xs font-mono">
					<span className="text-green-600 dark:text-green-400">
						expected: {violation.expected}
					</span>
					<span className="text-muted-foreground">→</span>
					<span className="text-red-500">actual: {violation.actual}</span>
				</div>
			)}
		</div>
	);
}
