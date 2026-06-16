import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

import { JsonViewer } from "#/components/shared/json-viewer";
import { Badge } from "#/components/ui/badge";
import { Card, CardContent, CardHeader } from "#/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs";
import { cn } from "#/lib/utils";
import { DiffViewer } from "./diff-viewer";
import { ViolationsList } from "./violations-list";

export interface ValidationResultData {
	endpointId?: string | null;
	endpointMethod?: string;
	endpointPath?: string;
	responseStatusCode: number;
	latencyMs?: number | null;
	outcome: "pass" | "warning" | "fail";
	outcomeReason?: string;
	violations: Array<Record<string, unknown>>;
	diff?: {
		entries: Array<Record<string, unknown>>;
		hasBreaking: boolean;
	} | null;
	requestSnapshot?: Record<string, unknown> | null;
	responseBody?: Record<string, unknown> | null;
	expectedSchema?: Record<string, unknown> | null;
}

function outcomeReason(result: ValidationResultData): string {
	if (result.outcomeReason) return result.outcomeReason;
	if (result.outcome === "pass") {
		return "Response matches the expected schema";
	}
	if (result.outcome === "fail") {
		return `${result.violations.length} violation(s) found — response does not match the expected schema`;
	}
	const hasSchema =
		result.expectedSchema !== null && result.expectedSchema !== undefined;
	if (!hasSchema) {
		return `No schema defined for HTTP ${result.responseStatusCode} in the spec — cannot validate response body`;
	}
	const hasBreakingDiff = result.diff?.hasBreaking;
	if (hasBreakingDiff) {
		return `Response structure matches schema but has structural differences from the generated mock`;
	}
	return "Response structure matches schema but values differ from the expected mock";
}

export function ValidationResultCard({
	result,
	expanded = false,
	onToggle,
}: {
	result: ValidationResultData;
	expanded?: boolean;
	onToggle?: () => void;
}) {
	const [internalExpanded, setInternalExpanded] = useState(expanded);
	const isExpanded = onToggle ? expanded : internalExpanded;

	function handleToggle() {
		if (onToggle) onToggle();
		else setInternalExpanded(!internalExpanded);
	}

	const outcomeColor = {
		pass: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500",
		warning:
			"bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500",
		fail: "bg-red-500/10 text-red-500 border-red-500",
	}[result.outcome];

	const reason = outcomeReason(result);
	const violationCount =
		result.violations?.filter(
			(v) => (v as { severity?: string }).severity === "error",
		).length ?? 0;
	const warningCount =
		result.violations?.filter(
			(v) => (v as { severity?: string }).severity === "warning",
		).length ?? 0;

	return (
		<Card>
			<CardHeader className="p-3">
				<button
					type="button"
					onClick={handleToggle}
					className="flex w-full items-center gap-3 text-left"
				>
					{isExpanded ? (
						<ChevronDown className="size-4 shrink-0 text-muted-foreground" />
					) : (
						<ChevronRight className="size-4 shrink-0 text-muted-foreground" />
					)}
					{result.endpointMethod && (
						<span className="inline-flex items-center rounded px-1.5 py-0.5 font-mono text-xs font-semibold text-white bg-slate-600">
							{result.endpointMethod}
						</span>
					)}
					{result.endpointPath && (
						<code className="text-xs font-mono text-muted-foreground truncate">
							{result.endpointPath}
						</code>
					)}
					<span
						className={cn(
							"inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold",
							outcomeColor,
						)}
					>
						{result.outcome.toUpperCase()}
					</span>
					<span className="text-xs text-muted-foreground">
						{result.responseStatusCode}
					</span>
					{result.latencyMs !== null && result.latencyMs !== undefined && (
						<span className="text-xs text-muted-foreground ml-auto">
							{result.latencyMs}ms
						</span>
					)}
				</button>
				<div className="px-1 pt-1.5 text-xs text-muted-foreground">
					{reason}
					{(violationCount > 0 || warningCount > 0) && (
						<span className="ml-2 space-x-1.5">
							{violationCount > 0 && (
								<Badge variant="destructive" className="text-[10px] px-1 py-0">
									{violationCount} error{violationCount !== 1 ? "s" : ""}
								</Badge>
							)}
							{warningCount > 0 && (
								<Badge variant="secondary" className="text-[10px] px-1 py-0">
									{warningCount} warning{warningCount !== 1 ? "s" : ""}
								</Badge>
							)}
						</span>
					)}
				</div>
			</CardHeader>
			{isExpanded && (
				<CardContent className="p-3 pt-3 border-t">
					<Tabs defaultValue="body">
						<TabsList className="mb-2">
							<TabsTrigger value="body" className="text-xs">
								Body
							</TabsTrigger>
							<TabsTrigger value="schema" className="text-xs">
								Schema
							</TabsTrigger>
							<TabsTrigger value="violations" className="text-xs">
								Violations ({result.violations.length})
							</TabsTrigger>
							<TabsTrigger value="diff" className="text-xs">
								Diff
							</TabsTrigger>
						</TabsList>
						<TabsContent value="body">
							{result.responseBody ? (
								<JsonViewer data={result.responseBody} />
							) : (
								<div className="text-sm text-muted-foreground italic py-2">
									No response body
								</div>
							)}
						</TabsContent>
						<TabsContent value="schema">
							{result.expectedSchema ? (
								<div className="rounded border p-3">
									<SchemaTree schema={result.expectedSchema} depth={0} />
								</div>
							) : (
								<div className="text-sm text-muted-foreground italic py-2">
									No expected schema for this status code
								</div>
							)}
						</TabsContent>
						<TabsContent value="violations">
							<ViolationsList
								violations={
									result.violations as Array<{
										type: string;
										path: string;
										expected?: string;
										actual?: string;
										message: string;
										severity: "warning" | "error";
									}>
								}
							/>
						</TabsContent>
						<TabsContent value="diff">
							<DiffViewer
								entries={
									(result.diff?.entries ?? []) as Array<{
										type: "CREATE" | "REMOVE" | "CHANGE";
										path: string;
										value?: unknown;
										oldValue?: unknown;
										breaking: boolean;
										category: string;
									}>
								}
							/>
						</TabsContent>
					</Tabs>
				</CardContent>
			)}
		</Card>
	);
}

function SchemaTree({
	schema,
	depth,
}: {
	schema: Record<string, unknown>;
	depth: number;
}) {
	const [expanded, setExpanded] = useState(depth < 2);
	const entries = Object.entries(schema);

	return (
		<div>
			{entries.map(([key, value]) => {
				const isNested =
					value !== null && typeof value === "object" && !Array.isArray(value);
				const isArray = Array.isArray(value);
				return (
					<div key={key}>
						<button
							type="button"
							disabled={!isNested && !isArray}
							onClick={() => setExpanded(!expanded)}
							className="flex w-full items-center gap-1.5 rounded-sm px-1 py-0.5 text-left text-sm hover:bg-muted/50"
							style={{ paddingLeft: `${depth * 16 + 4}px` }}
						>
							<span className="font-mono text-xs font-medium">{key}</span>
							<span className="text-xs text-muted-foreground">:</span>
							{isNested ? (
								<span className="text-xs text-cyan-600 dark:text-cyan-400 font-mono">
									{"{...}"}
								</span>
							) : isArray ? (
								<span className="text-xs text-purple-600 dark:text-purple-400 font-mono">
									[{(value as Array<unknown>).length}]
								</span>
							) : (
								<span className="text-xs text-muted-foreground font-mono">
									{String(value)}
								</span>
							)}
						</button>
						{isNested && expanded && (
							<SchemaTree
								schema={value as Record<string, unknown>}
								depth={depth + 1}
							/>
						)}
						{isArray && expanded && (value as Array<unknown>).length > 0 && (
							<SchemaTree
								schema={(value as Array<unknown>)[0] as Record<string, unknown>}
								depth={depth + 1}
							/>
						)}
					</div>
				);
			})}
		</div>
	);
}
