import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ChevronDown, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { getEndpoints, getSpec } from "#/lib/specs/functions";

export const Route = createFileRoute("/dashboard/specs/$specId")({
	component: SpecDetailPage,
});

type SpecData = Awaited<ReturnType<typeof getSpec>>;
type EndpointData = Awaited<ReturnType<typeof getEndpoints>>[number];

const methodColors: Record<string, string> = {
	GET: "bg-green-600",
	POST: "bg-blue-600",
	PUT: "bg-orange-600",
	PATCH: "bg-amber-600",
	DELETE: "bg-red-600",
	HEAD: "bg-purple-600",
	OPTIONS: "bg-slate-600",
};

function SpecDetailPage() {
	const { specId } = Route.useParams();
	const [spec, setSpec] = useState<SpecData | null>(null);
	const [endpoints, setEndpoints] = useState<EndpointData[]>([]);
	const [loading, setLoading] = useState(true);
	const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
		{},
	);

	useEffect(() => {
		getSpec({ data: { specId } })
			.then((data) => {
				setSpec(data);
				const latestVersion = data.versions?.[0];
				if (latestVersion) {
					return getEndpoints({ data: { specVersionId: latestVersion.id } });
				}
				return [];
			})
			.then((eps) => {
				setEndpoints(eps);
			})
			.finally(() => setLoading(false));
	}, [specId]);

	if (loading) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="size-8 animate-pulse rounded-full bg-muted" />
			</div>
		);
	}

	if (!spec) {
		return (
			<div className="flex flex-col items-center gap-4 py-12">
				<p className="text-muted-foreground">Spec not found</p>
				<Button asChild>
					<Link to="/dashboard/specs">Back to specs</Link>
				</Button>
			</div>
		);
	}

	const latestVersion = spec.versions?.[0];

	const groups = groupEndpoints(endpoints);

	function toggleGroup(tag: string) {
		setExpandedGroups((prev) => ({
			...prev,
			[tag]: !prev[tag],
		}));
	}

	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-center gap-4">
				<Button variant="outline" size="icon" asChild>
					<Link to="/dashboard/specs">
						<ArrowLeft className="size-4" />
					</Link>
				</Button>
				<div className="flex-1">
					<div className="flex items-center gap-3">
						<h2 className="text-2xl font-bold">{spec.name}</h2>
						{latestVersion && (
							<Badge variant="secondary">v{latestVersion.version}</Badge>
						)}
					</div>
					{spec.description && (
						<p className="mt-1 text-sm text-muted-foreground">
							{spec.description}
						</p>
					)}
					<p className="mt-1 text-xs text-muted-foreground">
						Created {new Date(spec.createdAt).toLocaleDateString()}
						{" · "}
						{endpoints.length} endpoints
					</p>
				</div>
			</div>

			<h3 className="text-sm font-medium text-muted-foreground">Endpoints</h3>
			<div className="rounded-md border">
				{endpoints.length === 0 ? (
					<div className="p-4 text-center text-sm text-muted-foreground">
						No endpoints found
					</div>
				) : (
					<div className="divide-y">
						{groups.map((group) => (
							<div key={group.tag}>
								<button
									type="button"
									onClick={() => toggleGroup(group.tag)}
									className="flex w-full items-center gap-2 bg-muted/30 px-3 py-2 text-left text-xs font-medium text-muted-foreground hover:bg-muted/50"
								>
									{expandedGroups[group.tag] ? (
										<ChevronDown className="size-3" />
									) : (
										<ChevronRight className="size-3" />
									)}
									{group.tag || "Ungrouped"}
									<span className="ml-auto">{group.endpoints.length}</span>
								</button>
								{expandedGroups[group.tag] !== false && (
									<div className="divide-y">
										{group.endpoints.map((ep) => (
											<Link
												key={ep.id}
												to="/dashboard/specs/$specId/endpoints/$endpointId"
												params={{
													specId,
													endpointId: ep.id,
												}}
												className="flex w-full items-center gap-3 px-3 py-2 text-sm hover:bg-muted/50"
											>
												<span
													className={`inline-flex items-center rounded px-1.5 py-0.5 font-mono text-xs text-white ${methodColors[ep.method] ?? "bg-slate-600"}`}
												>
													{ep.method}
												</span>
												<code className="truncate font-mono text-xs text-muted-foreground">
													{ep.path}
												</code>
											</Link>
										))}
									</div>
								)}
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}

function groupEndpoints(endpoints: EndpointData[]) {
	const grouped: Record<string, EndpointData[]> = {};
	for (const ep of endpoints) {
		const tag = extractTag(ep.path);
		if (!grouped[tag]) grouped[tag] = [];
		grouped[tag].push(ep);
	}
	return Object.entries(grouped).map(([tag, eps]) => ({ tag, endpoints: eps }));
}

function extractTag(path: string): string {
	const parts = path.split("/").filter(Boolean);
	return parts[0] ?? "";
}
