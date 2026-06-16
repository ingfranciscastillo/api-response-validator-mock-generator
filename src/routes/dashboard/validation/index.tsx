import { createFileRoute, Link } from "@tanstack/react-router";
import { Beaker, Clock } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent } from "#/components/ui/card";
import { EmptyState } from "#/components/ui/empty-state";
import { Input } from "#/components/ui/input";
import { PaginationControls } from "#/components/ui/pagination-controls";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import { Skeleton } from "#/components/ui/skeleton";
import { getSpecs } from "#/lib/specs/functions";
import { getValidationRuns } from "#/lib/validation/functions";

export const Route = createFileRoute("/dashboard/validation/")({
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

const statusOptions = ["completed", "failed", "processing"] as const;
const triggerOptions = [
	"manual",
	"workspace",
	"drift_scheduled",
	"api",
] as const;

const DEFAULT_PAGE_SIZE = 25;

function ValidationPage() {
	const [runs, setRuns] = useState<ValidationRun[]>([]);
	const [loading, setLoading] = useState(true);
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
	const [total, setTotal] = useState(0);
	const [totalPages, setTotalPages] = useState(0);

	const [specFilter, setSpecFilter] = useState("all");
	const [statusFilter, setStatusFilter] = useState("all");
	const [triggerFilter, setTriggerFilter] = useState("all");
	const [dateFrom, setDateFrom] = useState("");
	const [dateTo, setDateTo] = useState("");

	const [specs, setSpecs] = useState<Awaited<ReturnType<typeof getSpecs>>>([]);

	const fetchRuns = () => {
		setLoading(true);
		getValidationRuns({
			data: {
				specId: specFilter !== "all" ? specFilter : undefined,
				status: statusFilter !== "all" ? statusFilter : undefined,
				triggerType: triggerFilter !== "all" ? triggerFilter : undefined,
				dateFrom: dateFrom || undefined,
				dateTo: dateTo || undefined,
				page,
				pageSize,
			},
		})
			.then((data) => {
				setRuns(data.runs);
				setTotal(data.total);
				setTotalPages(data.totalPages);
			})
			.finally(() => setLoading(false));
	};

	useEffect(() => {
		fetchRuns();
	}, [
		page,
		pageSize,
		specFilter,
		statusFilter,
		triggerFilter,
		dateFrom,
		dateTo,
	]);

	useEffect(() => {
		getSpecs({ data: {} }).then(setSpecs);
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

			<div className="flex flex-wrap items-center gap-2">
				<Select value={specFilter} onValueChange={setSpecFilter}>
					<SelectTrigger className="w-[180px]">
						<SelectValue placeholder="All specs" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Specs</SelectItem>
						{specs.map((spec) => (
							<SelectItem key={spec.id} value={spec.id}>
								{spec.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<Select value={statusFilter} onValueChange={setStatusFilter}>
					<SelectTrigger className="w-[150px]">
						<SelectValue placeholder="All statuses" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Statuses</SelectItem>
						{statusOptions.map((s) => (
							<SelectItem key={s} value={s}>
								{s.charAt(0).toUpperCase() + s.slice(1)}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<Select value={triggerFilter} onValueChange={setTriggerFilter}>
					<SelectTrigger className="w-[160px]">
						<SelectValue placeholder="All triggers" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Triggers</SelectItem>
						{triggerOptions.map((t) => (
							<SelectItem key={t} value={t}>
								{triggerLabels[t]}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<Input
					type="date"
					value={dateFrom}
					onChange={(e) => setDateFrom(e.target.value)}
					className="w-[150px]"
					placeholder="From date"
				/>
				<Input
					type="date"
					value={dateTo}
					onChange={(e) => setDateTo(e.target.value)}
					className="w-[150px]"
					placeholder="To date"
				/>
			</div>

			{loading ? (
				<div className="space-y-2">
					{Array.from({ length: 3 }).map((_, i) => (
						<Card key={i}>
							<CardContent className="p-4">
								<div className="space-y-2">
									<Skeleton className="h-5 w-32" />
									<Skeleton className="h-4 w-64" />
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			) : runs.length === 0 ? (
				<EmptyState
					icon={<Beaker className="size-8" />}
					title="No validation runs yet"
					description="Send a request to an endpoint to start validating"
					action={
						<Button asChild>
							<Link to="/dashboard/validation/workspace">
								<Beaker className="size-4" />
								New Validation Run
							</Link>
						</Button>
					}
				/>
			) : (
				<>
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
					<PaginationControls
						page={page}
						totalPages={totalPages}
						total={total}
						pageSize={pageSize}
						onPageChange={setPage}
						onPageSizeChange={(s) => {
							setPageSize(s);
							setPage(1);
						}}
					/>
				</>
			)}
		</div>
	);
}
