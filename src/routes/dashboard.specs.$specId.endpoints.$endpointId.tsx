import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Beaker, Clock, FlaskConical } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { CommentsSection } from "#/components/shared/CommentsSection";
import { extractSchema } from "#/components/specs/response-schema-panel";
import { SchemaTreeViewer } from "#/components/specs/schema-tree-viewer";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs";
import { getEndpoint, getSpec } from "#/lib/specs/functions";
import { getEndpointValidationHistory } from "#/lib/validation/functions";

export const Route = createFileRoute(
	"/dashboard/specs/$specId/endpoints/$endpointId",
)({
	validateSearch: z.object({
		tab: z.enum(["request", "responses", "mocks", "history"]).optional(),
	}),
	component: EndpointDetailPage,
});

type EndpointData = Awaited<ReturnType<typeof getEndpoint>>;

const methodColors: Record<string, string> = {
	GET: "bg-green-600",
	POST: "bg-blue-600",
	PUT: "bg-orange-600",
	PATCH: "bg-amber-600",
	DELETE: "bg-red-600",
	HEAD: "bg-purple-600",
	OPTIONS: "bg-slate-600",
};

function EndpointDetailPage() {
	const { specId, endpointId } = Route.useParams();
	const { tab } = Route.useSearch();
	const navigate = useNavigate();
	const [endpoint, setEndpoint] = useState<EndpointData | null>(null);
	const [specName, setSpecName] = useState<string>("");
	const [loading, setLoading] = useState(true);
	const [activeTab, setActiveTab] = useState(tab ?? "request");
	const [history, setHistory] = useState<
		Awaited<ReturnType<typeof getEndpointValidationHistory>>
	>([]);
	const [historyLoading, setHistoryLoading] = useState(false);

	useEffect(() => {
		Promise.all([
			getEndpoint({ data: { endpointId } }),
			getSpec({ data: { specId } }).then(
				(s) => s?.name ?? "",
				() => "",
			),
		])
			.then(([ep, name]) => {
				setEndpoint(ep);
				setSpecName(name);
			})
			.finally(() => setLoading(false));
	}, [specId, endpointId]);

	useEffect(() => {
		if (activeTab !== "history") return;
		if (history.length > 0) return;
		setHistoryLoading(true);
		getEndpointValidationHistory({ data: { endpointId } })
			.then(setHistory)
			.finally(() => setHistoryLoading(false));
	}, [activeTab, endpointId, history.length]);

	if (loading) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="size-8 animate-pulse rounded-full bg-muted" />
			</div>
		);
	}

	if (!endpoint) {
		return (
			<div className="flex flex-col items-center gap-4 py-12">
				<p className="text-muted-foreground">Endpoint not found</p>
				<Button asChild>
					<Link to="/dashboard/specs/$specId" params={{ specId }}>
						Back to spec
					</Link>
				</Button>
			</div>
		);
	}

	const parameters = (
		endpoint.parameters
			? Array.isArray(endpoint.parameters)
				? (endpoint.parameters as Array<Record<string, unknown>>)
				: [endpoint.parameters as Record<string, unknown>]
			: []
	).filter(Boolean);

	const statusCodes = endpoint.responses
		? Object.entries(endpoint.responses as Record<string, unknown>).sort(
				([a], [b]) => a.localeCompare(b),
			)
		: [];

	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-center gap-4">
				<Button variant="outline" size="icon" asChild>
					<Link to="/dashboard/specs/$specId" params={{ specId }}>
						<ArrowLeft className="size-4" />
					</Link>
				</Button>
				<div className="flex-1">
					<div className="flex items-center gap-3">
						<span
							className={`inline-flex items-center rounded px-2 py-0.5 font-mono text-xs font-semibold text-white ${methodColors[endpoint.method] ?? "bg-slate-600"}`}
						>
							{endpoint.method}
						</span>
						<code className="rounded bg-muted px-2 py-1 text-sm font-mono">
							{endpoint.path}
						</code>
						{endpoint.operationId && (
							<span className="text-xs text-muted-foreground">
								{endpoint.operationId}
							</span>
						)}
					</div>
					<div className="mt-1 flex items-center gap-2">
						{endpoint.summary && (
							<p className="text-sm text-muted-foreground">
								{endpoint.summary}
							</p>
						)}
						<span className="text-xs text-muted-foreground">
							in{" "}
							<Link
								to="/dashboard/specs/$specId"
								params={{ specId }}
								className="underline-offset-4 underline hover:text-foreground"
							>
								{specName}
							</Link>
						</span>
					</div>
				</div>
				<div className="flex gap-2">
					<Button
						variant="outline"
						onClick={() =>
							navigate({
								to: "/dashboard/validation/workspace",
								search: { specId, endpointId },
							})
						}
					>
						<Beaker className="size-4" />
						Test
					</Button>
					<Button variant="outline" disabled>
						<FlaskConical className="size-4" />
						Generate Mocks
					</Button>
				</div>
			</div>

			<Tabs
				value={activeTab}
				onValueChange={(v) => setActiveTab(v as typeof activeTab)}
			>
				<TabsList>
					<TabsTrigger value="request">Request</TabsTrigger>
					<TabsTrigger value="responses">Responses</TabsTrigger>
					<TabsTrigger value="mocks">Mocks</TabsTrigger>
					<TabsTrigger value="history">Validation History</TabsTrigger>
					<TabsTrigger value="comments">Comments</TabsTrigger>
				</TabsList>

				<TabsContent value="request">
					<div className="flex flex-col gap-6">
						{parameters.length > 0 && (
							<div>
								<h4 className="mb-2 text-sm font-medium">Parameters</h4>
								<div className="overflow-hidden rounded-md border">
									<table className="w-full text-sm">
										<thead className="bg-muted/50">
											<tr>
												<th className="px-3 py-2 text-left font-medium">
													Name
												</th>
												<th className="px-3 py-2 text-left font-medium">In</th>
												<th className="px-3 py-2 text-left font-medium">
													Required
												</th>
												<th className="px-3 py-2 text-left font-medium">
													Type
												</th>
												<th className="px-3 py-2 text-left font-medium">
													Description
												</th>
											</tr>
										</thead>
										<tbody>
											{parameters.map((param, i) => (
												<tr key={i} className="border-t">
													<td className="px-3 py-2 font-mono text-xs font-medium">
														{String(param.name ?? "")}
													</td>
													<td className="px-3 py-2 text-xs text-muted-foreground">
														{String(param.in ?? "")}
													</td>
													<td className="px-3 py-2 text-xs">
														{param.required ? "Yes" : "No"}
													</td>
													<td className="px-3 py-2 font-mono text-xs text-muted-foreground">
														{String(
															param.schema
																? ((param.schema as Record<string, unknown>)
																		.type ?? "string")
																: "string",
														)}
													</td>
													<td className="px-3 py-2 text-xs text-muted-foreground">
														{String(param.description ?? "")}
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</div>
						)}

						{!!endpoint.requestBody && (
							<SchemaTreeViewer
								schema={endpoint.requestBody as Record<string, unknown>}
								title="Request Body"
							/>
						)}

						{parameters.length === 0 && !endpoint.requestBody && (
							<div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
								No request parameters or body defined
							</div>
						)}
					</div>
				</TabsContent>

				<TabsContent value="responses">
					{statusCodes.length > 0 ? (
						<div className="flex flex-col gap-3">
							{statusCodes.map(([code, response]) => {
								const schema = extractSchema(
									response as Record<string, unknown>,
								);
								return (
									<div key={code} className="rounded-md border p-3">
										<div className="mb-2 flex items-center gap-2">
											<Badge
												variant={
													code.startsWith("2")
														? "default"
														: code.startsWith("4") || code.startsWith("5")
															? "destructive"
															: "secondary"
												}
											>
												{code}
											</Badge>
											<span className="text-xs text-muted-foreground">
												{String(
													(response as Record<string, unknown>).description ??
														"",
												)}
											</span>
										</div>
										{schema && <SchemaTreeViewer schema={schema} />}
										{!schema && (
											<p className="text-xs text-muted-foreground italic">
												No content schema defined
											</p>
										)}
									</div>
								);
							})}
						</div>
					) : (
						<div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
							No responses defined
						</div>
					)}
				</TabsContent>

				<TabsContent value="mocks">
					<Card>
						<CardHeader>
							<CardTitle className="text-base">Mock Generation</CardTitle>
							<CardDescription>
								Coming in Phase 3 — generate realistic mock responses from your
								endpoint schemas.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground">
								You'll be able to generate example payloads, edge cases, and
								error responses with one click, and serve them via public URLs.
							</p>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="history">
					<Card>
						<CardHeader>
							<CardTitle className="text-base">Validation History</CardTitle>
							<CardDescription>
								Past validation runs and response diffs for this endpoint.
							</CardDescription>
						</CardHeader>
						<CardContent>
							{historyLoading ? (
								<div className="flex items-center justify-center py-8">
									<div className="size-6 animate-pulse rounded-full bg-muted" />
								</div>
							) : history.length === 0 ? (
								<p className="text-sm text-muted-foreground">
									No validation runs yet. Use the Test button to send a request
									to this endpoint.
								</p>
							) : (
								<div className="space-y-2">
									{history.map((entry) => (
										<div
											key={entry.id}
											className="flex items-center gap-3 rounded-md border p-3 text-sm"
										>
											<Badge
												variant={
													entry.outcome === "pass"
														? "default"
														: entry.outcome === "fail"
															? "destructive"
															: "secondary"
												}
											>
												{entry.outcome}
											</Badge>
											<span className="font-mono text-xs text-muted-foreground">
												{entry.responseStatusCode}
											</span>
											{entry.latencyMs !== null && (
												<span className="text-xs text-muted-foreground flex items-center gap-1">
													<Clock className="size-3" />
													{entry.latencyMs}ms
												</span>
											)}
											<span className="text-xs text-muted-foreground ml-auto">
												{new Date(entry.createdAt).toLocaleDateString()}{" "}
												{new Date(entry.createdAt).toLocaleTimeString()}
											</span>
											<Button variant="outline" size="sm" asChild>
												<Link
													to="/dashboard/validation/runs/$runId"
													params={{ runId: entry.runId }}
												>
													View Run
												</Link>
											</Button>
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="comments">
					<CommentsSection
						workspaceId=""
						entityType="endpoint"
						entityId={endpointId}
					/>
				</TabsContent>
			</Tabs>
		</div>
	);
}
