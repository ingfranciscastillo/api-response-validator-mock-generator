import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Clock } from "lucide-react";
import { useEffect, useState } from "react";

import { CommentsSection } from "#/components/shared/CommentsSection";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import type { ValidationResultData } from "#/components/validation/validation-result-card";
import { ValidationResultCard } from "#/components/validation/validation-result-card";
import { getValidationRun } from "#/lib/validation/functions";

export const Route = createFileRoute("/dashboard/validation/runs/$runId")({
	component: ValidationRunDetailPage,
});

type RunDetail = Awaited<ReturnType<typeof getValidationRun>>;

const triggerLabels: Record<string, string> = {
	manual: "Manual",
	workspace: "Workspace",
	drift_scheduled: "Scheduled",
	api: "API",
};

function ValidationRunDetailPage() {
	const { runId } = Route.useParams();
	const [run, setRun] = useState<RunDetail | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		getValidationRun({ data: { runId } })
			.then(setRun)
			.finally(() => setLoading(false));
	}, [runId]);

	if (loading) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="size-8 animate-pulse rounded-full bg-muted" />
			</div>
		);
	}

	if (!run) {
		return (
			<div className="flex flex-col items-center gap-4 py-12">
				<p className="text-muted-foreground">Validation run not found</p>
				<Button asChild>
					<Link to="/dashboard/validation">Back to runs</Link>
				</Button>
			</div>
		);
	}

	const duration = run.completedAt
		? Math.round(
				(new Date(run.completedAt).getTime() -
					new Date(run.startedAt).getTime()) /
					1000,
			)
		: null;

	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-center gap-4">
				<Button variant="outline" size="icon" asChild>
					<Link to="/dashboard/validation">
						<ArrowLeft className="size-4" />
					</Link>
				</Button>
				<div className="flex-1">
					<div className="flex items-center gap-3">
						<h2 className="text-2xl font-bold">
							{run.name ?? `Run ${run.id.slice(0, 8)}`}
						</h2>
						<Badge
							variant={
								run.status === "completed"
									? "default"
									: run.status === "failed"
										? "destructive"
										: "secondary"
							}
						>
							{run.status}
						</Badge>
						<Badge variant="secondary">
							{triggerLabels[run.triggerType] ?? run.triggerType}
						</Badge>
					</div>
					<div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
						{run.specName && <span>Spec: {run.specName}</span>}
						<span>
							{new Date(run.createdAt).toLocaleDateString()}{" "}
							{new Date(run.createdAt).toLocaleTimeString()}
						</span>
						{duration !== null && (
							<span className="flex items-center gap-1">
								<Clock className="size-3" />
								{duration}s
							</span>
						)}
					</div>
				</div>
			</div>

			<div className="flex items-center gap-4">
				<div className="flex items-center gap-2 text-sm">
					<span className="text-green-600 dark:text-green-400 font-semibold">
						{run.passedChecks}
					</span>
					<span className="text-muted-foreground">passed</span>
				</div>
				<div className="flex items-center gap-2 text-sm">
					<span className="text-amber-600 dark:text-amber-400 font-semibold">
						{run.warningChecks}
					</span>
					<span className="text-muted-foreground">warnings</span>
				</div>
				<div className="flex items-center gap-2 text-sm">
					<span className="text-red-500 font-semibold">{run.failedChecks}</span>
					<span className="text-muted-foreground">failed</span>
				</div>
				<span className="text-xs text-muted-foreground ml-auto">
					{run.totalChecks} total checks
				</span>
			</div>

			<div className="space-y-2">
				<h3 className="text-sm font-medium">Results</h3>
				{run.results.length === 0 ? (
					<div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
						No results
					</div>
				) : (
					run.results.map((result) => (
						<ValidationResultCard
							key={result.id}
							result={
								{
									endpointId: result.endpointId,
									responseStatusCode: result.responseStatusCode,
									latencyMs: result.latencyMs,
									outcome: result.outcome as "pass" | "warning" | "fail",
									violations:
										(result.violations as Array<Record<string, unknown>>) ?? [],
									diff: result.diff as {
										entries: Array<Record<string, unknown>>;
										hasBreaking: boolean;
									},
									requestSnapshot: result.requestSnapshot as Record<
										string,
										unknown
									> | null,
									responseBody: result.responseBody as Record<
										string,
										unknown
									> | null,
									expectedSchema: result.expectedSchema as Record<
										string,
										unknown
									> | null,
								} satisfies ValidationResultData
							}
						/>
					))
				)}
			</div>

			<CommentsSection entityType="validation_run" entityId={runId} />
		</div>
	);
}
