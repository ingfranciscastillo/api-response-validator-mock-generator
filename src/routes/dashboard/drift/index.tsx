import { createFileRoute } from "@tanstack/react-router";
import { ShieldAlert, ShieldOff } from "lucide-react";
import { useEffect, useState } from "react";
import { DriftAlertCard } from "#/components/drift/drift-alert-card";
import { EmptyState } from "#/components/ui/empty-state";
import { Skeleton } from "#/components/ui/skeleton";
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
				<div className="space-y-3">
					{Array.from({ length: 3 }).map((_, i) => (
						<div key={i} className="rounded-lg border p-4">
							<div className="space-y-2">
								<Skeleton className="h-5 w-48" />
								<Skeleton className="h-4 w-64" />
							</div>
						</div>
					))}
				</div>
			) : alerts.length === 0 ? (
				<EmptyState
					icon={<ShieldOff className="size-8" />}
					title="No drift alerts"
					description="Alerts will appear when breaking changes are detected between spec versions"
				/>
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
