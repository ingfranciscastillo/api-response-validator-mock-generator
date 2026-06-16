import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Button } from "#/components/ui/button";
import { ScrollArea } from "#/components/ui/scroll-area";
import { ValidationRequestBuilder } from "#/components/validation/validation-request-builder";
import type { ValidationResultData } from "#/components/validation/validation-result-card";
import { ValidationResultCard } from "#/components/validation/validation-result-card";
import { getEndpoints, getSpec, getSpecs } from "#/lib/specs/functions";

export const Route = createFileRoute("/dashboard/validation/workspace")({
	validateSearch: z.object({
		specId: z.string().optional(),
		endpointId: z.string().optional(),
	}),
	head: () => ({
		meta: [
			{
				title:
					"API Testing Workspace — API Response Validator & Mock Generator",
			},
		],
	}),
	component: ValidationWorkspacePage,
});

type SpecSummary = Awaited<ReturnType<typeof getSpecs>>[number];
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

function ValidationWorkspacePage() {
	const { specId: initialSpecId, endpointId: initialEndpointId } =
		Route.useSearch();
	const [specs, setSpecs] = useState<SpecSummary[]>([]);
	const [selectedSpecId, setSelectedSpecId] = useState(initialSpecId ?? "");
	const [endpoints, setEndpoints] = useState<EndpointData[]>([]);
	const [selectedEndpointId, setSelectedEndpointId] = useState(
		initialEndpointId ?? "",
	);
	const [loadingSpecs, setLoadingSpecs] = useState(true);
	const [latestResult, setLatestResult] = useState<ValidationResultData | null>(
		null,
	);

	useEffect(() => {
		getSpecs({ data: {} })
			.then(setSpecs)
			.finally(() => setLoadingSpecs(false));
	}, []);

	useEffect(() => {
		if (!selectedSpecId) {
			setEndpoints([]);
			return;
		}
		getSpec({ data: { specId: selectedSpecId } })
			.then((spec) => {
				const versionId = spec?.versions?.[0]?.id;
				if (versionId) {
					return getEndpoints({ data: { specVersionId: versionId } });
				}
				return [] as EndpointData[];
			})
			.then(setEndpoints);
	}, [selectedSpecId]);

	const selectedEndpoint = endpoints.find((ep) => ep.id === selectedEndpointId);

	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-center gap-3">
				<Button variant="outline" size="icon" asChild>
					<a href="/dashboard/validation">
						<ArrowLeft className="size-4" />
					</a>
				</Button>
				<h2 className="text-2xl font-bold">API Testing Workspace</h2>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-4">
				<div className="rounded-md border p-3 flex flex-col gap-3 max-h-[calc(100dvh-13rem)] overflow-hidden">
					<div>
						<h4 className="text-sm font-medium mb-2">Specification</h4>
						{loadingSpecs ? (
							<div className="h-20 animate-pulse rounded bg-muted" />
						) : (
							<div className="space-y-1">
								{specs.map((spec) => (
									<button
										key={spec.id}
										type="button"
										onClick={() => {
											setSelectedSpecId(spec.id);
											setSelectedEndpointId("");
											setLatestResult(null);
										}}
										className={`w-full rounded px-2 py-1.5 text-left text-sm transition-colors ${
											selectedSpecId === spec.id
												? "bg-accent text-accent-foreground"
												: "hover:bg-muted/50"
										}`}
									>
										{spec.name}
									</button>
								))}
								{specs.length === 0 && (
									<p className="text-xs text-muted-foreground">
										No specs available
									</p>
								)}
							</div>
						)}
					</div>

					{selectedSpecId && endpoints.length > 0 && (
						<ScrollArea className="flex-1">
							<h4 className="text-sm font-medium mb-2">Endpoints</h4>
							<div className="space-y-1">
								{endpoints.map((ep) => (
									<button
										key={ep.id}
										type="button"
										onClick={() => {
											setSelectedEndpointId(ep.id);
											setLatestResult(null);
										}}
										className={`w-full flex items-center gap-2 rounded px-2 py-1.5 text-left text-xs transition-colors ${
											selectedEndpointId === ep.id
												? "bg-accent text-accent-foreground"
												: "hover:bg-muted/50"
										}`}
									>
										<span
											className={`inline-flex items-center rounded px-1 py-0.5 font-mono text-[10px] text-white ${methodColors[ep.method] ?? "bg-slate-600"}`}
										>
											{ep.method}
										</span>
										<code className="truncate">{ep.path}</code>
									</button>
								))}
							</div>
						</ScrollArea>
					)}
					{selectedSpecId && endpoints.length === 0 && (
						<p className="text-xs text-muted-foreground mt-2">
							No endpoints found
						</p>
					)}
				</div>

				<div className="min-w-0 flex flex-col gap-4">
					{selectedEndpoint ? (
						<ValidationRequestBuilder
							specId={selectedSpecId}
							endpointId={selectedEndpointId}
							endpoint={selectedEndpoint}
							onResult={setLatestResult}
						/>
					) : (
						<div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
							Select a specification and endpoint to start testing
						</div>
					)}

					{latestResult ? (
						<div className="flex flex-col gap-2 animate-rise-in">
							<h4 className="text-sm font-medium">Response</h4>
							<ValidationResultCard result={latestResult} expanded />
						</div>
					) : null}
				</div>
			</div>
		</div>
	);
}
