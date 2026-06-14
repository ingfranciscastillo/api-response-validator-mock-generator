import { createFileRoute, Link } from "@tanstack/react-router";
import { Beaker, Clock, FlaskConical } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent } from "#/components/ui/card";
import { getValidationRuns } from "#/lib/validation/functions";

export const Route = createFileRoute("/dashboard/validation")({
	component: ValidationPage,
});

type ValidationRun = Awaited<
	ReturnType<typeof getValidationRuns>
>["runs"][number];

const triggerLabels: Record<string, string> = {
	manual: "Manual",
	workspace: "Workspace",
	drift_scheduled: "Scheduled",
	api: "API",
};

function ValidationPage() {
	const [runs, setRuns] = useState<ValidationRun[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		getValidationRuns({ data: { organizationId: "" } })
			.then((data) => setRuns(data.runs))
			.finally(() => setLoading(false));
	}, []);

	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold">Validation Runs</h2>
					<p className="text-muted-foreground mt-1">
						View and manage API validation results
					</p>
				</div>
				<Button asChild>
					<Link to="/dashboard/validation/workspace">
						<Beaker className="size-4" />
						New Validation Run
					</Link>
				</Button>
			</div>

			{loading ? (
				<div className="flex items-center justify-center py-12">
					<div className="size-8 animate-pulse rounded-full bg-muted" />
				</div>
			) : runs.length === 0 ? (
				<div className="rounded-lg border border-border bg-surface p-8 text-center">
					<FlaskConical className="size-8 mx-auto text-muted-foreground" />
					<p className="text-muted-foreground mt-3">No validation runs yet</p>
					<p className="text-muted-foreground text-sm mt-1">
						Send a request to an endpoint to start validating
					</p>
					<Button asChild className="mt-4">
						<Link to="/dashboard/validation/workspace">
							<Beaker className="size-4" />
							New Validation Run
						</Link>
					</Button>
				</div>
			) : (
				<div className="space-y-2">
					{runs.map((run) => (
						<Link
							key={run.id}
							to="/dashboard/validation/runs/$runId"
							params={{ runId: run.id }}
							className="block"
						>
							<Card className="hover:bg-muted/50 transition-colors">
								<CardContent className="p-4">
									<div className="flex items-center gap-4">
										<Badge variant="secondary" className="shrink-0">
											{triggerLabels[run.triggerType] ?? run.triggerType}
										</Badge>
										<div className="flex-1 min-w-0">
											<p className="text-sm font-medium truncate">
												{run.name ?? `Run ${run.id.slice(0, 8)}`}
											</p>
											<div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
												<span>
													{new Date(run.createdAt).toLocaleDateString()}{" "}
													{new Date(run.createdAt).toLocaleTimeString()}
												</span>
												{run.completedAt && (
													<span className="flex items-center gap-1">
														<Clock className="size-3" />
														{Math.round(
															(new Date(run.completedAt).getTime() -
																new Date(run.startedAt).getTime()) /
																1000,
														)}
														s
													</span>
												)}
											</div>
										</div>
										<Badge
											variant={
												run.status === "completed"
													? "default"
													: run.status === "failed"
														? "destructive"
														: "secondary"
											}
											className="shrink-0"
										>
											{run.status}
										</Badge>
									</div>
									<div className="flex items-center gap-2 mt-2">
										<div className="flex items-center gap-1.5 text-xs">
											<span className="text-green-600 dark:text-green-400 font-medium">
												{run.passedChecks}
											</span>
											<span className="text-muted-foreground">pass</span>
										</div>
										<div className="flex items-center gap-1.5 text-xs">
											<span className="text-amber-600 dark:text-amber-400 font-medium">
												{run.warningChecks}
											</span>
											<span className="text-muted-foreground">warn</span>
										</div>
										<div className="flex items-center gap-1.5 text-xs">
											<span className="text-red-500 font-medium">
												{run.failedChecks}
											</span>
											<span className="text-muted-foreground">fail</span>
										</div>
										<span className="text-xs text-muted-foreground ml-auto">
											{run.totalChecks} checks
										</span>
									</div>
								</CardContent>
							</Card>
						</Link>
					))}
				</div>
			)}
		</div>
	);
}
