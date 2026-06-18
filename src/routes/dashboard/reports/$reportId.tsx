import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Download, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { getReport } from "#/lib/reports/functions";
import { generateHtmlReport } from "#/lib/reports/generator";

export const Route = createFileRoute("/dashboard/reports/$reportId")({
	head: () => ({
		meta: [
			{
				title: "Report Details — API Response Validator & Mock Generator",
			},
		],
	}),
	component: ReportDetailPage,
});

function ReportDetailPage() {
	const { t } = useTranslation();
	const { reportId } = Route.useParams();
	const [report, setReport] = useState<Awaited<
		ReturnType<typeof getReport>
	> | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		getReport({ data: { reportId } })
			.then(setReport)
			.catch(() => setReport(null))
			.finally(() => setLoading(false));
	}, [reportId]);

	const handleDownloadHtml = () => {
		if (!report) return;
		const html = generateHtmlReport(
			report.data as Parameters<typeof generateHtmlReport>[0],
		);
		const blob = new Blob([html], { type: "text/html" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `${report.name.replace(/\s+/g, "-").toLowerCase()}.html`;
		a.click();
		URL.revokeObjectURL(url);
	};

	const handleDownloadPdf = async () => {
		if (!report) return;
		const html = generateHtmlReport(
			report.data as Parameters<typeof generateHtmlReport>[0],
		);
		const { default: html2pdf } = await import("html2pdf.js");
		const opt = {
			margin: 0.5,
			filename: `${report.name.replace(/\s+/g, "-").toLowerCase()}.pdf`,
			image: { type: "jpeg", quality: 0.98 },
			html2canvas: { scale: 2, useCORS: true },
			jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
		};
		const container = document.createElement("div");
		container.innerHTML = html;
		container.style.position = "absolute";
		container.style.left = "-9999px";
		container.style.top = "0";
		document.body.appendChild(container);
		await html2pdf()
			.set(opt as Record<string, unknown>)
			.from(container)
			.save();
		document.body.removeChild(container);
	};

	const handleDownloadJson = () => {
		if (!report) return;
		const blob = new Blob([JSON.stringify(report.data, null, 2)], {
			type: "application/json",
		});
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `${report.name.replace(/\s+/g, "-").toLowerCase()}.json`;
		a.click();
		URL.revokeObjectURL(url);
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="size-8 animate-pulse rounded-full bg-muted" />
			</div>
		);
	}

	if (!report) {
		return (
			<div className="flex flex-col gap-4">
				<Link
					to="/dashboard/reports"
					className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
				>
					<ArrowLeft className="size-4" />
					{t("dashboard:reports.backToReports")}
				</Link>
				<div className="rounded-lg border border-border bg-surface p-8 text-center">
					<p className="text-muted-foreground">
						{t("dashboard:reports.reportNotFound")}
					</p>
				</div>
			</div>
		);
	}

	const data = report.data as {
		summary?: {
			totalRuns?: number;
			totalResults?: number;
			passCount?: number;
			warningCount?: number;
			failCount?: number;
			passRate?: number;
			warningRate?: number;
			failRate?: number;
		};
		endpointSummary?: Array<{
			method: string;
			path: string;
			total: number;
			pass: number;
			warning: number;
			fail: number;
		}>;
		topViolations?: Array<{
			type: string;
			count: number;
			severity: string;
		}>;
		dailyBreakdown?: Array<{
			date: string;
			pass: number;
			warning: number;
			fail: number;
		}>;
	};

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Link
						to="/dashboard/reports"
						className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
					>
						<ArrowLeft className="size-4" />
						{t("common:back")}
					</Link>
				</div>
				<div className="flex items-center gap-2">
					<Button variant="outline" size="sm" onClick={handleDownloadJson}>
						<Download className="size-4" />
						{t("dashboard:reports.downloadJson")}
					</Button>
					<Button variant="outline" size="sm" onClick={handleDownloadHtml}>
						<Download className="size-4" />
						{t("dashboard:reports.downloadHtml")}
					</Button>
					<Button variant="outline" size="sm" onClick={handleDownloadPdf}>
						<Download className="size-4" />
						{t("dashboard:reports.downloadPdf")}
					</Button>
				</div>
			</div>

			<div className="flex items-center gap-3">
				<FileText className="size-6 text-muted-foreground" />
				<div>
					<h2 className="text-2xl font-bold">{report.name}</h2>
					{report.description && (
						<p className="text-muted-foreground text-sm">
							{report.description}
						</p>
					)}
				</div>
				<Badge variant="outline">{report.type}</Badge>
			</div>

			{data.summary && (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-xs text-muted-foreground">
								{t("dashboard:reports.totalRuns")}
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-xl font-bold">{data.summary.totalRuns}</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-xs text-muted-foreground">
								{t("dashboard:reports.totalChecks")}
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-xl font-bold">
								{data.summary.totalResults}
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-xs text-muted-foreground">
								{t("dashboard:reports.passRate")}
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-xl font-bold text-green-600">
								{data.summary.passRate}%
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-xs text-muted-foreground">
								{t("dashboard:reports.warningRate")}
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-xl font-bold text-yellow-600">
								{data.summary.warningRate}%
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-xs text-muted-foreground">
								{t("dashboard:reports.failRate")}
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-xl font-bold text-red-600">
								{data.summary.failRate}%
							</div>
						</CardContent>
					</Card>
				</div>
			)}

			{data.endpointSummary && data.endpointSummary.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle className="text-sm">
							{t("dashboard:reports.endpointSummary")}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="overflow-x-auto">
							<table className="w-full text-sm">
								<thead>
									<tr className="border-b text-left text-muted-foreground">
										<th className="pb-2 font-medium">
											{t("dashboard:reports.tableMethod")}
										</th>
										<th className="pb-2 font-medium">
											{t("dashboard:reports.tablePath")}
										</th>
										<th className="pb-2 text-right font-medium">
											{t("dashboard:reports.tableTotal")}
										</th>
										<th className="pb-2 text-right font-medium text-green-600">
											{t("dashboard:reports.tablePass")}
										</th>
										<th className="pb-2 text-right font-medium text-yellow-600">
											{t("dashboard:reports.tableWarning")}
										</th>
										<th className="pb-2 text-right font-medium text-red-600">
											{t("dashboard:reports.tableFail")}
										</th>
									</tr>
								</thead>
								<tbody>
									{data.endpointSummary.map((ep) => (
										<tr
											key={`${ep.method}-${ep.path}`}
											className="border-b last:border-0"
										>
											<td className="py-2 pr-4 font-medium">{ep.method}</td>
											<td className="py-2 pr-4 font-mono text-xs">{ep.path}</td>
											<td className="py-2 text-right">{ep.total}</td>
											<td className="py-2 text-right text-green-600">
												{ep.pass}
											</td>
											<td className="py-2 text-right text-yellow-600">
												{ep.warning}
											</td>
											<td className="py-2 text-right text-red-600">
												{ep.fail}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</CardContent>
				</Card>
			)}

			{data.topViolations && data.topViolations.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle className="text-sm">
							{t("dashboard:reports.topViolations")}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="overflow-x-auto">
							<table className="w-full text-sm">
								<thead>
									<tr className="border-b text-left text-muted-foreground">
										<th className="pb-2 font-medium">
											{t("dashboard:reports.tableType")}
										</th>
										<th className="pb-2 text-right font-medium">
											{t("dashboard:reports.tableCount")}
										</th>
										<th className="pb-2 text-right font-medium">
											{t("dashboard:reports.tableSeverity")}
										</th>
									</tr>
								</thead>
								<tbody>
									{data.topViolations.map((v) => (
										<tr
											key={`${v.type}-${v.severity}`}
											className="border-b last:border-0"
										>
											<td className="py-2 pr-4 font-mono text-xs">{v.type}</td>
											<td className="py-2 text-right">{v.count}</td>
											<td className="py-2 text-right capitalize">
												{v.severity}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
