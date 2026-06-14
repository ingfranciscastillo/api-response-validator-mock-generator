import { Link } from "@tanstack/react-router";
import { Badge } from "#/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import type { DashboardOverview } from "#/lib/dashboard/functions";

interface RecentRunsTableProps {
	runs: DashboardOverview["recentRuns"];
}

export function RecentRunsTable({ runs }: RecentRunsTableProps) {
	if (runs.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="text-sm">Recent Validation Runs</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-muted-foreground">
						No validation runs yet
					</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-sm">Recent Validation Runs</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="space-y-2">
					{runs.map((run) => (
						<Link
							key={run.id}
							to="/dashboard/validation/runs/$runId"
							params={{ runId: run.id }}
							className="flex items-center justify-between rounded-md border p-3 text-sm transition-colors hover:bg-muted/50"
						>
							<div className="flex items-center gap-2">
								<span className="font-medium truncate max-w-[200px]">
									{run.name ?? "Unnamed Run"}
								</span>
								<Badge
									variant={run.status === "completed" ? "default" : "secondary"}
								>
									{run.status}
								</Badge>
							</div>
							<div className="flex items-center gap-3 text-xs text-muted-foreground">
								<span>
									{run.passedChecks}/{run.totalChecks} passed
								</span>
								<span>{new Date(run.createdAt).toLocaleDateString()}</span>
							</div>
						</Link>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
