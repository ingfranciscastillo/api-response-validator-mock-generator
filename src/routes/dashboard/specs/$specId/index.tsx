import { createFileRoute, Link } from "@tanstack/react-router";
import {
	ArrowLeft,
	ChevronDown,
	ChevronRight,
	FlaskConical,
	GitCompare,
	Play,
} from "lucide-react";
import { useEffect, useState } from "react";
import { MockGenerationModal } from "#/components/mocks/mock-generation-modal";
import { CommentsSection } from "#/components/shared/CommentsSection";
import { JsonViewer } from "#/components/shared/json-viewer";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Switch } from "#/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs";
import { getDriftChecks, updateDriftCheck } from "#/lib/drift/functions";
import { getEndpoints, getSpec, getSpecVersions } from "#/lib/specs/functions";

export const Route = createFileRoute("/dashboard/specs/$specId/")({
	head: () => ({
		meta: [
			{
				title:
					"Specification Details — API Response Validator & Mock Generator",
			},
		],
	}),
	component: SpecDetailPage,
});

type SpecData = Awaited<ReturnType<typeof getSpec>>;
type EndpointData = Awaited<ReturnType<typeof getEndpoints>>[number];
type VersionRow = Awaited<ReturnType<typeof getSpecVersions>>[number];

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
	const [versions, setVersions] = useState<VersionRow[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
		{},
	);
	const [mockModalOpen, setMockModalOpen] = useState(false);
	const [tab, setTab] = useState("endpoints");

	const [driftEnabled, setDriftEnabled] = useState(false);
	const [driftCheckId, setDriftCheckId] = useState<string | null>(null);

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
			.catch((err) => {
				setError(err instanceof Error ? err.message : "Failed to load spec");
			})
			.finally(() => setLoading(false));

		getSpecVersions({ data: { specId } }).then(setVersions);
		getDriftChecks().then((checks) => {
			const check = checks.find((c) => c.specId === specId);
			if (check) {
				setDriftEnabled(check.enabled);
				setDriftCheckId(check.id);
			}
		});
	}, [specId]);

	const handleDriftToggle = async (enabled: boolean) => {
		setDriftEnabled(enabled);
		if (driftCheckId) {
			await updateDriftCheck({
				data: { checkId: driftCheckId, enabled },
			});
		}
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="size-8 animate-pulse rounded-full bg-muted" />
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex flex-col items-center gap-4 py-12">
				<p className="text-destructive">{error}</p>
				<Button asChild>
					<Link to="/dashboard/specs">Back to specs</Link>
				</Button>
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
				<div className="flex items-center gap-2">
					<div className="flex items-center gap-2 text-sm text-muted-foreground">
						<span>Monitor</span>
						<Switch
							checked={driftEnabled}
							onCheckedChange={handleDriftToggle}
						/>
					</div>
					<Button variant="outline" size="sm" asChild>
						<Link to="/dashboard/validation/workspace" search={{ specId }}>
							<Play className="size-3.5" />
							Run Validation
						</Link>
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => setMockModalOpen(true)}
					>
						<FlaskConical className="size-3.5" />
						Generate Mock
					</Button>
					{versions.length > 1 && (
						<Button variant="outline" size="sm" asChild>
							<Link to="/dashboard/specs/$specId/compare" params={{ specId }}>
								<GitCompare className="size-3.5" />
								Compare Versions
							</Link>
						</Button>
					)}
				</div>
			</div>

			<Tabs value={tab} onValueChange={setTab}>
				<TabsList>
					<TabsTrigger value="endpoints">Endpoints</TabsTrigger>
					<TabsTrigger value="schema">Schema</TabsTrigger>
					<TabsTrigger value="versions">Versions</TabsTrigger>
					<TabsTrigger value="drift">Drift Settings</TabsTrigger>
					<TabsTrigger value="activity">Activity</TabsTrigger>
				</TabsList>

				<TabsContent value="endpoints">
					<h3 className="text-sm font-medium text-muted-foreground mb-2">
						Endpoints
					</h3>
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
				</TabsContent>

				<TabsContent value="schema">
					<div className="rounded-md border">
						{latestVersion?.openapiSpec ? (
							<JsonViewer data={latestVersion.openapiSpec} />
						) : (
							<div className="p-4 text-center text-sm text-muted-foreground">
								No schema data available
							</div>
						)}
					</div>
				</TabsContent>

				<TabsContent value="versions">
					<div className="rounded-md border divide-y">
						{versions.length === 0 ? (
							<div className="p-4 text-center text-sm text-muted-foreground">
								No versions found
							</div>
						) : (
							versions.map((v) => (
								<div
									key={v.id}
									className="flex items-center justify-between px-4 py-3"
								>
									<div>
										<p className="text-sm font-medium">Version {v.version}</p>
										<p className="text-xs text-muted-foreground">
											{new Date(v.createdAt).toLocaleString()}
										</p>
									</div>
									{v.id !== latestVersion?.id && (
										<Button variant="outline" size="sm" asChild>
											<Link
												to="/dashboard/specs/$specId/compare"
												params={{ specId }}
											>
												Compare
											</Link>
										</Button>
									)}
								</div>
							))
						)}
					</div>
				</TabsContent>

				<TabsContent value="drift">
					<div className="rounded-md border p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium">Drift Detection</p>
								<p className="text-xs text-muted-foreground mt-1">
									Automatically monitor this spec for breaking changes
								</p>
							</div>
							<Switch
								checked={driftEnabled}
								onCheckedChange={handleDriftToggle}
							/>
						</div>
						{driftEnabled && (
							<p className="text-xs text-muted-foreground mt-3">
								Breaking changes detected between spec versions will create
								alerts visible on the Drift page.
							</p>
						)}
					</div>
				</TabsContent>

				<TabsContent value="activity">
					<CommentsSection entityType="specification" entityId={specId} />
				</TabsContent>
			</Tabs>

			<MockGenerationModal
				open={mockModalOpen}
				onOpenChange={setMockModalOpen}
				onGenerated={() => {}}
				defaultSpecId={specId}
			/>
		</div>
	);

	function toggleGroup(tag: string) {
		setExpandedGroups((prev) => ({
			...prev,
			[tag]: !prev[tag],
		}));
	}
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
