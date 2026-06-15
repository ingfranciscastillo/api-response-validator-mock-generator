import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { ReportCard } from "#/components/reports/report-card";
import { ReportGenerateDialog } from "#/components/reports/report-generate-dialog";
import { Button } from "#/components/ui/button";
import {
	createReport,
	deleteReport,
	getReports,
} from "#/lib/reports/functions";

export const Route = createFileRoute("/dashboard/reports/")({
	component: ReportsPage,
});

function ReportsPage() {
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
					<h2 className="text-2xl font-bold">Reports</h2>
					<p className="text-muted-foreground mt-1">
						View analytics and usage reports for your APIs
					</p>
				</div>
				<Button onClick={() => setDialogOpen(true)}>
					<Plus className="size-4" />
					Generate Report
				</Button>
			</div>

			{loading ? (
				<div className="flex items-center justify-center py-12">
					<div className="size-8 animate-pulse rounded-full bg-muted" />
				</div>
			) : reports.length === 0 ? (
				<div className="rounded-lg border border-border bg-surface p-8 text-center">
					<p className="text-muted-foreground">No reports available</p>
					<p className="text-muted-foreground text-sm mt-1">
						Generate your first report to see validation analytics
					</p>
				</div>
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
