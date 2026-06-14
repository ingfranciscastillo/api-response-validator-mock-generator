import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/reports")({
	component: ReportsPage,
});

function ReportsPage() {
	return (
		<div className="flex flex-col gap-4">
			<div>
				<h2 className="text-2xl font-bold">Reports</h2>
				<p className="text-text-secondary mt-1">
					View analytics and usage reports for your APIs
				</p>
			</div>
			<div className="rounded-lg border border-border bg-surface p-8 text-center">
				<p className="text-text-tertiary">No reports available</p>
				<p className="text-text-tertiary text-sm mt-1">
					Reports will appear once you have active API usage
				</p>
			</div>
		</div>
	);
}
