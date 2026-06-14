import { createFileRoute } from "@tanstack/react-router";
import {
	FileText,
	FlaskConical,
	Route as RouteIcon,
	ShieldCheck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { RecentRunsTable } from "#/components/dashboard/recent-runs-table";
import { StatCard } from "#/components/dashboard/stat-card";
import { ViolationsChart } from "#/components/dashboard/violations-chart";
import {
	type DashboardOverview,
	getDashboardCharts,
	getDashboardOverview,
} from "#/lib/dashboard/functions";

export const Route = createFileRoute("/dashboard/")({
	component: DashboardIndexPage,
});

function DashboardIndexPage() {
	const [overview, setOverview] = useState<DashboardOverview | null>(null);
	const [chartData, setChartData] = useState<
		Awaited<ReturnType<typeof getDashboardCharts>>
	>({ daily: [] });
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		Promise.all([
			getDashboardOverview({ data: { organizationId: "" } }),
			getDashboardCharts({ data: { organizationId: "" } }),
		])
			.then(([ov, charts]) => {
				setOverview(ov);
				setChartData(charts);
			})
			.finally(() => setLoading(false));
	}, []);

	if (loading) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="size-8 animate-pulse rounded-full bg-muted" />
			</div>
		);
	}

	if (!overview) return null;

	return (
		<div className="flex flex-col gap-6">
			<div>
				<h2 className="text-2xl font-bold">Dashboard</h2>
				<p className="text-muted-foreground mt-1">
					Overview of your API specifications and validation activity
				</p>
			</div>

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<StatCard
					title="Specifications"
					value={overview.totalSpecs}
					icon={<FileText className="size-4" />}
				/>
				<StatCard
					title="Endpoints"
					value={overview.totalEndpoints}
					icon={<RouteIcon className="size-4" />}
				/>
				<StatCard
					title="Mock Datasets"
					value={overview.totalMocks}
					icon={<FlaskConical className="size-4" />}
				/>
				<StatCard
					title="Validation Runs"
					value={overview.totalRuns}
					icon={<ShieldCheck className="size-4" />}
				/>
			</div>

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				<StatCard
					title="Pass Rate"
					value={`${overview.passRate}%`}
					description="Of all validation checks"
				/>
				<StatCard
					title="Warning Rate"
					value={`${overview.warningRate}%`}
					description="Of all validation checks"
				/>
				<StatCard
					title="Fail Rate"
					value={`${overview.failRate}%`}
					description="Of all validation checks"
				/>
			</div>

			<div className="grid gap-4 lg:grid-cols-2">
				<ViolationsChart data={chartData.daily} />
				<RecentRunsTable runs={overview.recentRuns} />
			</div>
		</div>
	);
}
