import { createFileRoute } from "@tanstack/react-router";
import { Clock, Play, ShieldOff } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import { EmptyState } from "#/components/ui/empty-state";
import { Skeleton } from "#/components/ui/skeleton";
import { Switch } from "#/components/ui/switch";
import {
	checkSpecForDrift,
	createDriftCheck,
	deleteDriftCheck,
	getDriftChecks,
	updateDriftCheck,
} from "#/lib/drift/functions";
import { getSpecs } from "#/lib/specs/functions";

export const Route = createFileRoute("/dashboard/drift/monitored-specs")({
	head: () => ({
		meta: [
			{
				title: "Monitored Specs — API Response Validator & Mock Generator",
			},
		],
	}),
	component: MonitoredSpecsPage,
});

function MonitoredSpecsPage() {
	const [checks, setChecks] = useState<
		Awaited<ReturnType<typeof getDriftChecks>>
	>([]);
	const [specs, setSpecs] = useState<Awaited<ReturnType<typeof getSpecs>>>([]);
	const [loading, setLoading] = useState(true);
	const [checkingIds, setCheckingIds] = useState<Set<string>>(new Set());

	const fetchData = () => {
		setLoading(true);
		Promise.all([getDriftChecks(), getSpecs({ data: {} })])
			.then(([checksData, specsData]) => {
				setChecks(checksData);
				setSpecs(specsData);
			})
			.finally(() => setLoading(false));
	};

	useEffect(() => {
		fetchData();
	}, []);

	const monitoredSpecIds = new Set(checks.map((c) => c.specId));

	const handleToggle = async (specId: string, enable: boolean) => {
		if (enable) {
			await createDriftCheck({
				data: { specId },
			});
		} else {
			const check = checks.find((c) => c.specId === specId);
			if (check) {
				await deleteDriftCheck({ data: { checkId: check.id } });
			}
		}
		fetchData();
	};

	const handleCheckNow = async (specId: string) => {
		setCheckingIds((prev) => new Set(prev).add(specId));
		try {
			await checkSpecForDrift({
				data: { specId },
			});
		} finally {
			setCheckingIds((prev) => {
				const next = new Set(prev);
				next.delete(specId);
				return next;
			});
		}
	};

	const getCheckForSpec = (specId: string) =>
		checks.find((c) => c.specId === specId);

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center justify-between">
				<p className="text-sm text-muted-foreground">
					{checks.filter((c) => c.enabled).length} monitored of {specs.length}{" "}
					specs
				</p>
			</div>

			{loading ? (
				<div className="space-y-2">
					{Array.from({ length: 3 }).map((_, i) => (
						<Card key={i}>
							<CardContent className="flex items-center justify-between py-3">
								<div className="space-y-1.5">
									<Skeleton className="h-4 w-40" />
									<Skeleton className="h-3 w-56" />
								</div>
								<Skeleton className="size-8 rounded-md" />
							</CardContent>
						</Card>
					))}
				</div>
			) : specs.length === 0 ? (
				<EmptyState
					icon={<ShieldOff className="size-8" />}
					title="No specs available"
					description="Upload an API specification first to enable drift monitoring"
				/>
			) : (
				<div className="space-y-2">
					{specs.map((spec) => {
						const check = getCheckForSpec(spec.id);
						const isMonitored = !!check;
						const isEnabled = check?.enabled ?? false;
						const isChecking = checkingIds.has(spec.id);

						return (
							<Card key={spec.id}>
								<CardContent className="flex items-center justify-between py-3">
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2">
											<p className="text-sm font-medium truncate">
												{spec.name}
											</p>
											{isMonitored && (
												<Badge
													variant={isEnabled ? "default" : "secondary"}
													className="text-xs"
												>
													{isEnabled ? "Monitoring" : "Paused"}
												</Badge>
											)}
										</div>
										<div className="flex items-center gap-3 mt-0.5">
											{isMonitored && check?.lastRunAt && (
												<span className="flex items-center gap-1 text-xs text-muted-foreground">
													<Clock className="size-3" />
													Last run: {new Date(check.lastRunAt).toLocaleString()}
												</span>
											)}
											{isMonitored && check?.schedule && (
												<span className="text-xs text-muted-foreground font-mono">
													{check.schedule}
												</span>
											)}
										</div>
									</div>
									<div className="flex items-center gap-2 ml-4">
										{isMonitored && (
											<Button
												variant="outline"
												size="sm"
												onClick={() => handleCheckNow(spec.id)}
												disabled={isChecking}
												className="gap-1"
											>
												<Play className="size-3" />
												{isChecking ? "Checking..." : "Check Now"}
											</Button>
										)}
										<Switch
											checked={isMonitored && isEnabled}
											onCheckedChange={(checked) =>
												handleToggle(spec.id, checked)
											}
										/>
									</div>
								</CardContent>
							</Card>
						);
					})}
				</div>
			)}
		</div>
	);
}
