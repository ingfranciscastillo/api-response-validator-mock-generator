import { createFileRoute } from "@tanstack/react-router";
import { ShieldAlert, ShieldOff } from "lucide-react";
import { useEffect, useState } from "react";
import { DriftAlertCard } from "#/components/drift/drift-alert-card";
import { EmptyState } from "#/components/ui/empty-state";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import { Skeleton } from "#/components/ui/skeleton";
import { getDriftAlerts, resolveDriftAlert } from "#/lib/drift/functions";
import { getSpecs } from "#/lib/specs/functions";

export const Route = createFileRoute("/dashboard/drift/")({
	component: DriftPage,
});

type DriftAlert = Awaited<ReturnType<typeof getDriftAlerts>>[number];

const severityOptions = ["high", "medium", "low"] as const;
const typeOptions = ["breaking", "warning", "info"] as const;
const statusOptions = ["open", "resolved", "acknowledged"] as const;

function DriftPage() {
	const [alerts, setAlerts] = useState<DriftAlert[]>([]);
	const [loading, setLoading] = useState(true);
	const [statusFilter, setStatusFilter] = useState<string>("open");
	const [specFilter, setSpecFilter] = useState<string>("all");
	const [severityFilter, setSeverityFilter] = useState<string>("all");
	const [typeFilter, setTypeFilter] = useState<string>("all");

	const [specs, setSpecs] = useState<Awaited<ReturnType<typeof getSpecs>>>([]);

	const fetchAlerts = () => {
		setLoading(true);
		getDriftAlerts({
			data: {
				status: statusFilter === "all" ? undefined : statusFilter,
				specId: specFilter === "all" ? undefined : specFilter,
				severity: severityFilter === "all" ? undefined : severityFilter,
				type: typeFilter === "all" ? undefined : typeFilter,
			},
		})
			.then(setAlerts)
			.finally(() => setLoading(false));
	};

	useEffect(() => {
		fetchAlerts();
	}, [statusFilter, specFilter, severityFilter, typeFilter]);

	useEffect(() => {
		getSpecs({ data: {} }).then(setSpecs);
	}, []);

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
			</div>

			<div className="flex flex-wrap items-center gap-2">
				<Select value={statusFilter} onValueChange={setStatusFilter}>
					<SelectTrigger className="w-[140px]">
						<SelectValue placeholder="Status" />
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
				<Select value={severityFilter} onValueChange={setSeverityFilter}>
					<SelectTrigger className="w-[140px]">
						<SelectValue placeholder="All severities" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Severities</SelectItem>
						{severityOptions.map((s) => (
							<SelectItem key={s} value={s}>
								{s.charAt(0).toUpperCase() + s.slice(1)}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<Select value={typeFilter} onValueChange={setTypeFilter}>
					<SelectTrigger className="w-[140px]">
						<SelectValue placeholder="All types" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Types</SelectItem>
						{typeOptions.map((t) => (
							<SelectItem key={t} value={t}>
								{t.charAt(0).toUpperCase() + t.slice(1)}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
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
							onResolve={statusFilter === "open" ? handleResolve : undefined}
						/>
					))}
				</div>
			)}
		</div>
	);
}
