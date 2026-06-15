import { Activity, CheckCircle, FileText, Zap } from "lucide-react";

const stats = [
	{ icon: FileText, label: "APIs Monitored", value: "12" },
	{ icon: CheckCircle, label: "Success Rate", value: "94.2%" },
	{ icon: Activity, label: "Violations", value: "8" },
	{ icon: Zap, label: "Mocks Generated", value: "1,247" },
];

const recentRuns = [
	{ name: "Petstore API", outcome: "Pass", checks: "24/24", date: "2m ago" },
	{
		name: "Payment Gateway",
		outcome: "Fail",
		checks: "18/24",
		date: "15m ago",
	},
	{ name: "User Service", outcome: "Warning", checks: "22/24", date: "1h ago" },
];

export function DashboardPreview() {
	return (
		<section className="px-4 py-24" id="demo-preview">
			<div className="mx-auto max-w-5xl text-center">
				<h2 className="text-display-sm font-bold text-text-primary">
					See your API health at a glance
				</h2>
				<p className="mt-4 mb-12 text-lg text-text-secondary">
					A live dashboard that gives you full visibility into your API quality.
				</p>
				<div className="glass-panel overflow-hidden text-left">
					<div className="border-b border-border px-6 py-4">
						<div className="flex items-center gap-2">
							<div className="size-3 rounded-full bg-error" />
							<div className="size-3 rounded-full bg-warning" />
							<div className="size-3 rounded-full bg-success" />
							<span className="ml-2 text-sm text-text-tertiary">
								Dashboard Overview
							</span>
						</div>
					</div>
					<div className="p-6">
						<div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
							{stats.map((stat) => (
								<div
									key={stat.label}
									className="rounded-lg border border-border bg-surface p-4"
								>
									<div className="mb-2 flex items-center gap-2 text-text-tertiary">
										<stat.icon className="size-4" />
										<span className="text-xs">{stat.label}</span>
									</div>
									<div className="text-2xl font-bold text-text-primary">
										{stat.value}
									</div>
								</div>
							))}
						</div>
						<div className="mb-6">
							<div className="flex items-end gap-2">
								{Array.from({ length: 7 }).map((_, i) => (
									<div
										key={i}
										className="flex-1 rounded-t bg-accent-blue/20"
										style={{ height: `${30 + Math.random() * 50}px` }}
									/>
								))}
							</div>
						</div>
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b border-border text-left text-text-tertiary">
									<th className="pb-2 font-medium">Run</th>
									<th className="pb-2 font-medium">Outcome</th>
									<th className="pb-2 font-medium">Checks</th>
									<th className="pb-2 font-medium">Date</th>
								</tr>
							</thead>
							<tbody>
								{recentRuns.map((run) => (
									<tr key={run.name} className="border-b border-border/50">
										<td className="py-3 text-text-primary">{run.name}</td>
										<td className="py-3">
											<span
												className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
													run.outcome === "Pass"
														? "bg-success/10 text-success"
														: run.outcome === "Fail"
															? "bg-error/10 text-error"
															: "bg-warning/10 text-warning"
												}`}
											>
												{run.outcome}
											</span>
										</td>
										<td className="py-3 text-text-secondary">{run.checks}</td>
										<td className="py-3 text-text-tertiary">{run.date}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</section>
	);
}
