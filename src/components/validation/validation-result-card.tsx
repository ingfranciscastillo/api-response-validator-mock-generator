import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

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
	violations: Array<Record<string, unknown>>;
	diff?: {
		entries: Array<Record<string, unknown>>;
		hasBreaking: boolean;
	} | null;
	requestSnapshot?: Record<string, unknown> | null;
	responseBody?: Record<string, unknown> | null;
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
			</CardHeader>
			{isExpanded && (
				<CardContent className="p-3 pt-0 border-t">
					<Tabs defaultValue="violations">
						<TabsList className="mb-2">
							<TabsTrigger value="violations" className="text-xs">
								Violations ({result.violations.length})
							</TabsTrigger>
							<TabsTrigger value="diff" className="text-xs">
								Diff
							</TabsTrigger>
						</TabsList>
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
