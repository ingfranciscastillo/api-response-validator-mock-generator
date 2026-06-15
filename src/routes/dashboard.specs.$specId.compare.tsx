import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowLeft, CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import {
	compareSpecificationVersions,
	type SpecChange,
} from "#/lib/specs/compare";
import { getSpecVersions } from "#/lib/specs/functions";

export const Route = createFileRoute("/dashboard/specs/$specId/compare")({
	component: SpecComparePage,
});

function SpecComparePage() {
	const { specId } = Route.useParams();
	const [versions, setVersions] = useState<
		Awaited<ReturnType<typeof getSpecVersions>>
	>([]);
	const [fromId, setFromId] = useState("");
	const [toId, setToId] = useState("");
	const [comparison, setComparison] = useState<{
		changes: SpecChange[];
		breakingCount: number;
		nonBreakingCount: number;
		summary: string;
		fromVersion: number;
		toVersion: number;
	} | null>(null);
	const [loading, setLoading] = useState(true);
	const [comparing, setComparing] = useState(false);

	useEffect(() => {
		getSpecVersions({ data: { specId } })
			.then((v) => {
				setVersions(v);
				if (v.length >= 2) {
					setFromId(v[1].id);
					setToId(v[0].id);
				} else if (v.length === 1) {
					setToId(v[0].id);
				}
			})
			.finally(() => setLoading(false));
	}, [specId]);

	const handleCompare = async () => {
		if (!fromId || !toId) return;
		setComparing(true);
		try {
			const result = await compareSpecificationVersions(fromId, toId);
			setComparison(result);
		} finally {
			setComparing(false);
		}
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="size-8 animate-pulse rounded-full bg-muted" />
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center gap-2">
				<Link
					to="/dashboard/specs/$specId"
					params={{ specId }}
					className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
				>
					<ArrowLeft className="size-4" />
					Back to spec
				</Link>
			</div>

			<div>
				<h2 className="text-2xl font-bold">Version Comparison</h2>
				<p className="text-muted-foreground mt-1">
					Compare two spec versions to detect breaking changes
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="text-sm">Select Versions</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex items-end gap-4">
						<div className="space-y-1">
							<label className="text-xs font-medium">From (older)</label>
							<select
								className="w-40 rounded-md border border-input bg-background px-3 py-2 text-sm"
								value={fromId}
								onChange={(e) => setFromId(e.target.value)}
							>
								{versions.map((v) => (
									<option key={v.id} value={v.id}>
										v{v.version}
									</option>
								))}
							</select>
						</div>
						<div className="space-y-1">
							<label className="text-xs font-medium">To (newer)</label>
							<select
								className="w-40 rounded-md border border-input bg-background px-3 py-2 text-sm"
								value={toId}
								onChange={(e) => setToId(e.target.value)}
							>
								{versions.map((v) => (
									<option key={v.id} value={v.id}>
										v{v.version}
									</option>
								))}
							</select>
						</div>
						<Button
							onClick={handleCompare}
							disabled={!fromId || !toId || fromId === toId || comparing}
						>
							{comparing ? "Comparing..." : "Compare"}
						</Button>
					</div>
				</CardContent>
			</Card>

			{comparison && (
				<>
					<div className="flex items-center gap-4">
						<div className="flex items-center gap-2 text-sm">
							<AlertTriangle className="size-4 text-red-500" />
							<span className="font-medium text-red-600">
								{comparison.breakingCount} breaking
							</span>
						</div>
						<div className="flex items-center gap-2 text-sm">
							<CheckCircle className="size-4 text-green-500" />
							<span className="font-medium text-green-600">
								{comparison.nonBreakingCount} non-breaking
							</span>
						</div>
						<p className="text-sm text-muted-foreground">
							v{comparison.fromVersion} → v{comparison.toVersion}
						</p>
					</div>

					<Card>
						<CardHeader>
							<CardTitle className="text-sm">Changes</CardTitle>
						</CardHeader>
						<CardContent>
							{comparison.changes.length === 0 ? (
								<p className="text-sm text-muted-foreground">
									No differences found
								</p>
							) : (
								<div className="space-y-1">
									{comparison.changes.map((change, i) => (
										<div
											key={i}
											className={`flex items-start gap-2 rounded-md border p-2 text-sm ${
												change.breaking
													? "border-red-200 bg-red-50"
													: "border-green-200 bg-green-50"
											}`}
										>
											<Badge
												variant={change.breaking ? "destructive" : "secondary"}
												className="shrink-0"
											>
												{change.type}
											</Badge>
											<div className="min-w-0 flex-1">
												<p className="font-mono text-xs break-all">
													{change.path.join(".")}
												</p>
												<p className="text-xs text-muted-foreground mt-0.5">
													{change.breaking ? "Breaking" : "Non-breaking"}
												</p>
											</div>
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>
				</>
			)}
		</div>
	);
}
