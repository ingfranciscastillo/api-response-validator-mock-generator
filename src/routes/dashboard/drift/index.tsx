import { createFileRoute } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { DriftAlertCard } from "#/components/drift/drift-alert-card";
import { getDriftAlerts, resolveDriftAlert } from "#/lib/drift/functions";

export const Route = createFileRoute("/dashboard/drift/")({
	component: DriftPage,
});

function DriftPage() {
	const [alerts, setAlerts] = useState<
		Awaited<ReturnType<typeof getDriftAlerts>>
	>([]);
	const [loading, setLoading] = useState(true);
	const [filter, setFilter] = useState<string>("open");

	const fetchAlerts = () => {
		setLoading(true);
		getDriftAlerts({
			data: {
				organizationId: "",
				status: filter === "all" ? undefined : filter,
			},
		})
			.then(setAlerts)
			.finally(() => setLoading(false));
	};

	useEffect(() => {
		fetchAlerts();
	}, [filter]);

	const handleResolve = async (id: string) => {
		await resolveDriftAlert({ data: { alertId: id } });
		fetchAlerts();
	};

	const openCount = alerts.filter((a) => a.status === "open").length;
	const resolvedCount = alerts.filter((a) => a.status === "resolved").length;

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold">Drift Detection</h2>
					<p className="text-muted-foreground mt-1">
						Monitor API specifications for breaking changes and drift
					</p>
				</div>
			</div>

			<div className="flex items-center gap-4">
				<div className="flex items-center gap-2 text-sm">
					<ShieldAlert className="size-4 text-red-500" />
					<span className="font-medium">{openCount} open</span>
				</div>
				<div className="flex items-center gap-2 text-sm text-muted-foreground">
					<span>{resolvedCount} resolved</span>
				</div>
				<select
					className="ml-auto rounded-md border border-input bg-background px-3 py-1 text-sm"
					value={filter}
					onChange={(e) => setFilter(e.target.value)}
				>
					<option value="open">Open</option>
					<option value="resolved">Resolved</option>
					<option value="all">All</option>
				</select>
			</div>

			{loading ? (
				<div className="flex items-center justify-center py-12">
					<div className="size-8 animate-pulse rounded-full bg-muted" />
				</div>
			) : alerts.length === 0 ? (
				<div className="rounded-lg border border-border bg-surface p-8 text-center">
					<p className="text-muted-foreground">No drift alerts</p>
					<p className="text-muted-foreground text-sm mt-1">
						Alerts will appear when breaking changes are detected between spec
						versions
					</p>
				</div>
			) : (
				<div className="space-y-3">
					{alerts.map((alert) => (
						<DriftAlertCard
							key={alert.id}
							alert={{
								id: alert.id,
								specId: alert.specId,
								type: alert.type,
								severity: alert.severity,
								summary: alert.summary,
								status: alert.status,
								detectedAt: alert.detectedAt,
							}}
							onResolve={filter === "open" ? handleResolve : undefined}
						/>
					))}
				</div>
			)}
		</div>
	);
}
