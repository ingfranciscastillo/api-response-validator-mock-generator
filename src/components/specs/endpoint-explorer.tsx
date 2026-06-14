import { Badge } from "#/components/ui/badge";
import { cn } from "#/lib/utils";
import { SchemaTreeViewer } from "./schema-tree-viewer";

type Endpoint = {
	id: string;
	method: string;
	path: string;
	summary: string | null;
	operationId: string | null;
	parameters: unknown;
	requestBody: unknown;
	responses: unknown;
};

const methodColors: Record<string, string> = {
	GET: "bg-green-600 hover:bg-green-700",
	POST: "bg-blue-600 hover:bg-blue-700",
	PUT: "bg-orange-600 hover:bg-orange-700",
	PATCH: "bg-amber-600 hover:bg-amber-700",
	DELETE: "bg-red-600 hover:bg-red-700",
	HEAD: "bg-purple-600 hover:bg-purple-700",
	OPTIONS: "bg-slate-600 hover:bg-slate-700",
};

export function EndpointExplorer({ endpoint }: { endpoint: Endpoint | null }) {
	if (!endpoint) {
		return (
			<div className="flex items-center justify-center rounded-lg border border-dashed p-12 text-sm text-muted-foreground">
				Select an endpoint to explore
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

	const responses = endpoint.responses as Record<string, unknown> | null;
	const statusCodes = responses
		? Object.entries(responses).sort(([a], [b]) => a.localeCompare(b))
		: [];

	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-center gap-3">
				<Badge
					className={cn(
						"font-mono text-xs border-0 text-white",
						methodColors[endpoint.method] ?? "bg-slate-600",
					)}
				>
					{endpoint.method}
				</Badge>
				<code className="rounded bg-muted px-2 py-1 text-sm font-mono">
					{endpoint.path}
				</code>
			</div>

			{endpoint.summary && (
				<p className="text-sm text-muted-foreground">{endpoint.summary}</p>
			)}

			{parameters.length > 0 && (
				<div>
					<h4 className="mb-2 text-sm font-medium">Parameters</h4>
					<div className="overflow-hidden rounded-md border">
						<table className="w-full text-sm">
							<thead className="bg-muted/50">
								<tr>
									<th className="px-3 py-2 text-left font-medium">Name</th>
									<th className="px-3 py-2 text-left font-medium">In</th>
									<th className="px-3 py-2 text-left font-medium">Required</th>
									<th className="px-3 py-2 text-left font-medium">Type</th>
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
													? ((param.schema as Record<string, unknown>).type ??
															"string")
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

			{statusCodes.length > 0 && (
				<div>
					<h4 className="mb-2 text-sm font-medium">Responses</h4>
					<div className="flex flex-col gap-3">
						{statusCodes.map(([code, response]) => (
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
											(response as Record<string, unknown>).description ?? "",
										)}
									</span>
								</div>
								{extractSchema(response as Record<string, unknown>) && (
									<SchemaTreeViewer
										schema={
											extractSchema(
												response as Record<string, unknown>,
											) as Record<string, unknown>
										}
									/>
								)}
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}

function extractSchema(
	response: Record<string, unknown>,
): Record<string, unknown> | null {
	const content = response.content as Record<string, unknown> | undefined;
	if (!content) return null;
	const jsonContent = content["application/json"] as
		| Record<string, unknown>
		| undefined;
	if (!jsonContent) return null;
	return (jsonContent.schema as Record<string, unknown>) ?? null;
}
