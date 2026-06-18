import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ReportCard } from "#/components/reports/report-card";
import { ReportGenerateDialog } from "#/components/reports/report-generate-dialog";
import { Button } from "#/components/ui/button";
import { EmptyState } from "#/components/ui/empty-state";
import { Skeleton } from "#/components/ui/skeleton";
import {
	createReport,
	deleteReport,
	getReports,
} from "#/lib/reports/functions";

export const Route = createFileRoute("/dashboard/reports/")({
	head: () => ({
		meta: [
			{
				title: "Reports — API Response Validator & Mock Generator",
			},
		],
	}),
	component: ReportsPage,
});

function ReportsPage() {
	const { t } = useTranslation();
	const [reports, setReports] = useState<
		Awaited<ReturnType<typeof getReports>>
	>([]);
	const [loading, setLoading] = useState(true);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [generating, setGenerating] = useState(false);

	const fetchReports = () => {
		setLoading(true);
		getReports()
			.then(setReports)
			.finally(() => setLoading(false));
	};

	useEffect(() => {
		fetchReports();
	}, []);

	const handleGenerate = async (data: {
		name: string;
		description?: string;
		days: number;
	}) => {
		setGenerating(true);
		try {
			await createReport({
				data: { ...data },
			});
			setDialogOpen(false);
			fetchReports();
		} finally {
			setGenerating(false);
		}
	};

	const handleDelete = async (id: string) => {
		await deleteReport({ data: { reportId: id } });
		fetchReports();
	};

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold">{t("dashboard:reports.title")}</h2>
					<p className="text-muted-foreground mt-1">
						{t("dashboard:reports.description")}
					</p>
				</div>
				<Button onClick={() => setDialogOpen(true)}>
					<Plus className="size-4" />
					{t("dashboard:reports.generateReport")}
				</Button>
			</div>

			{loading ? (
				<div className="space-y-2">
					{Array.from({ length: 3 }).map((_, i) => (
						<div key={i} className="rounded-lg border p-4">
							<div className="space-y-2">
								<Skeleton className="h-5 w-40" />
								<Skeleton className="h-4 w-56" />
							</div>
						</div>
					))}
				</div>
			) : reports.length === 0 ? (
				<EmptyState
					icon={<BarChart3 className="size-8" />}
					title={t("dashboard:reports.noReports")}
					description={t("dashboard:reports.noReportsDescription")}
				/>
			) : (
				<div className="grid gap-3">
					{reports.map((r) => (
						<ReportCard
							key={r.id}
							id={r.id}
							name={r.name}
							description={r.description}
							type={r.type}
							status={r.status}
							createdAt={r.createdAt.toString()}
							onDelete={handleDelete}
						/>
					))}
				</div>
			)}

			<ReportGenerateDialog
				open={dialogOpen}
				onClose={() => setDialogOpen(false)}
				onGenerate={handleGenerate}
				generating={generating}
			/>
		</div>
	);
}
