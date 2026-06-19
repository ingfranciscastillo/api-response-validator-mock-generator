import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
	AlertTriangle,
	FileText,
	FlaskConical,
	RefreshCw,
	Route as RouteIcon,
	ShieldCheck,
} from "lucide-react";
import { lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { RecentRunsTable } from "#/components/dashboard/recent-runs-table";
import { StatCard } from "#/components/dashboard/stat-card";
import { Button } from "#/components/ui/button";
import {
	getDashboardCharts,
	getDashboardOverview,
} from "#/lib/dashboard/functions";

const ViolationsChart = lazy(() =>
	import("#/components/dashboard/violations-chart").then((m) => ({
		default: m.ViolationsChart,
	})),
);

export const Route = createFileRoute("/dashboard/")({
	head: () => ({
		meta: [{ title: "Dashboard — API Response Validator & Mock Generator" }],
	}),
	component: DashboardIndexPage,
});

function DashboardIndexPage() {
	const { t } = useTranslation();
	const { data: overview } = useSuspenseQuery({
		queryKey: ["dashboard", "overview"],
		queryFn: getDashboardOverview,
	});

	const { data: chartData } = useSuspenseQuery({
		queryKey: ["dashboard", "charts"],
		queryFn: () => getDashboardCharts({ data: {} }),
	});

	if (!overview) {
		return (
			<div className="flex flex-col items-center justify-center gap-4 py-16">
				<AlertTriangle className="size-10 text-red-500" />
				<div className="text-center">
					<p className="text-lg font-medium">
						{t("dashboard:errorStateTitle")}
					</p>
					<p className="text-sm text-muted-foreground mt-1">
						{t("common:noData")}
					</p>
				</div>
				<Button
					variant="outline"
					size="sm"
					onClick={() => window.location.reload()}
				>
					<RefreshCw className="size-4 mr-1" />
					{t("common:retry")}
				</Button>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-6">
			<div>
				<h2 className="text-2xl font-bold">{t("dashboard:title")}</h2>
				<p className="text-muted-foreground mt-1">
					{t("dashboard:overviewDescription")}
				</p>
			</div>

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<StatCard
					title={t("dashboard:statSpecifications")}
					value={overview.totalSpecs}
					icon={<FileText className="size-4" />}
				/>
				<StatCard
					title={t("dashboard:statEndpoints")}
					value={overview.totalEndpoints}
					icon={<RouteIcon className="size-4" />}
				/>
				<StatCard
					title={t("dashboard:statMockDatasets")}
					value={overview.totalMocks}
					icon={<FlaskConical className="size-4" />}
				/>
				<StatCard
					title={t("dashboard:statValidationRuns")}
					value={overview.totalRuns}
					icon={<ShieldCheck className="size-4" />}
				/>
			</div>

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				<StatCard
					title={t("dashboard:stats.passRate")}
					value={`${overview.passRate}%`}
					description={t("dashboard:ofAllChecks")}
				/>
				<StatCard
					title={t("dashboard:warningRate")}
					value={`${overview.warningRate}%`}
					description={t("dashboard:ofAllChecks")}
				/>
				<StatCard
					title={t("dashboard:failRate")}
					value={`${overview.failRate}%`}
					description={t("dashboard:ofAllChecks")}
				/>
			</div>

			<div className="grid gap-4 lg:grid-cols-2">
				<Suspense
					fallback={
						<div className="h-[250px] animate-pulse rounded-lg bg-muted" />
					}
				>
					<ViolationsChart data={chartData.daily} />
				</Suspense>
				<RecentRunsTable runs={overview.recentRuns} />
			</div>
		</div>
	);
}
