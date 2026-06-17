import { useNavigate } from "@tanstack/react-router";
import { Plus, Save, Send, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { MonacoEditor } from "#/components/editors/monaco-editor";

import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs";
import { Textarea } from "#/components/ui/textarea";
import { runValidation } from "#/lib/validation/functions";
import type { ValidationResultData } from "./validation-result-card";

interface EndpointData {
	id: string;
	specId: string;
	method: string;
	path: string;
	serverUrl: string | null;
	parameters: unknown;
	requestBody: unknown;
	responses: unknown;
}

interface RequestBuilderProps {
	specId: string;
	endpointId: string;
	endpoint: EndpointData;
	onResult?: (result: ValidationResultData) => void;
}

interface PathParamValue {
	name: string;
	value: string;
}

interface QueryParamValue {
	name: string;
	value: string;
}

function extractRequestBodyTemplate(requestBody: unknown): string | null {
	if (!requestBody) return null;
	const rb = requestBody as Record<string, unknown>;
	const content = rb.content as Record<string, unknown> | undefined;
	const jsonContent = content?.["application/json"] as
		| Record<string, unknown>
		| undefined;
	const schema = jsonContent?.schema as Record<string, unknown> | undefined;
	if (!schema) return null;

	const example = schema.example as unknown;
	if (example) return JSON.stringify(example, null, 2);

	const props = schema.properties as Record<string, unknown> | undefined;
	if (props) {
		const template: Record<string, unknown> = {};
		for (const [key, prop] of Object.entries(props)) {
			const p = prop as Record<string, unknown>;
			if (p.example !== undefined) {
				template[key] = p.example;
			} else if (p.default !== undefined) {
				template[key] = p.default;
			} else if (p.type === "string") {
				template[key] = p.enum ? (p.enum as Array<unknown>)[0] : "string";
			} else if (p.type === "integer" || p.type === "number") {
				template[key] = 0;
			} else if (p.type === "boolean") {
				template[key] = false;
			} else {
				template[key] = null;
			}
		}
		return JSON.stringify(template, null, 2);
	}

	const ref = schema.$ref as string | undefined;
	if (ref) return JSON.stringify({ [`$$ref`]: ref }, null, 2);

	return null;
}

export function ValidationRequestBuilder({
	specId,
	endpointId,
	endpoint,
	onResult,
}: RequestBuilderProps) {
	const navigate = useNavigate();
	const [method, setMethod] = useState(endpoint.method);
	const [urlBase, setUrlBase] = useState("");
	const [pathParams, setPathParams] = useState<PathParamValue[]>([]);
	const [queryParams, setQueryParams] = useState<QueryParamValue[]>([]);
	const [headersText, setHeadersText] = useState("{}");
	const [bodyText, setBodyText] = useState("");
	const [sending, setSending] = useState(false);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [lastPayload, setLastPayload] = useState<{
		url: string;
		method: string;
		headers: Record<string, string>;
		body: unknown;
	} | null>(null);

	const specParams = useMemo(() => {
		const params = endpoint.parameters;
		if (!params) return [];
		if (Array.isArray(params)) return params as Array<Record<string, unknown>>;
		return [params as Record<string, unknown>];
	}, [endpoint.parameters]);

	const pathParamDefs = useMemo(
		() => specParams.filter((p) => p.in === "path"),
		[specParams],
	);
	const queryParamDefs = useMemo(
		() => specParams.filter((p) => p.in === "query"),
		[specParams],
	);
	const headerParamDefs = useMemo(
		() => specParams.filter((p) => p.in === "header"),
		[specParams],
	);

	useEffect(() => {
		setMethod(endpoint.method);
		const serverUrl = endpoint.serverUrl ?? "";
		setUrlBase(serverUrl);

		const paramsFromPath = pathParamDefs.map((p) => ({
			name: String(p.name ?? ""),
			value: String((p as { example?: string }).example ?? ""),
		}));
		setPathParams(paramsFromPath);

		const initialQueryParams = queryParamDefs
			.filter(
				(p) =>
					p.required === true ||
					(p as { example?: string }).example !== undefined,
			)
			.map((p) => ({
				name: String(p.name ?? ""),
				value: String((p as { example?: string }).example ?? ""),
			}));
		setQueryParams(initialQueryParams);

		const headerValues: Record<string, string> = {};
		for (const p of headerParamDefs) {
			const ex = (p as { example?: string }).example;
			if (ex) headerValues[String(p.name)] = ex;
		}
		if (Object.keys(headerValues).length > 0) {
			setHeadersText(JSON.stringify(headerValues, null, 2));
		}

		const bodyTemplate = extractRequestBodyTemplate(endpoint.requestBody);
		if (bodyTemplate) setBodyText(bodyTemplate);
	}, [endpoint, pathParamDefs, queryParamDefs, headerParamDefs]);

	const constructedUrl = useMemo(() => {
		let result = urlBase + endpoint.path;
		for (const pp of pathParams) {
			result = result.replace(`{${pp.name}}`, pp.value || `{${pp.name}}`);
		}
		const qs = queryParams
			.filter((qp) => qp.name)
			.map(
				(qp) =>
					`${encodeURIComponent(qp.name)}=${encodeURIComponent(qp.value)}`,
			)
			.join("&");
		if (qs) result += `?${qs}`;
		return result;
	}, [urlBase, endpoint.path, pathParams, queryParams]);

	function updatePathParam(name: string, value: string) {
		setPathParams((prev) =>
			prev.map((p) => (p.name === name ? { ...p, value } : p)),
		);
	}

	function updateQueryParam(name: string, value: string) {
		setQueryParams((prev) =>
			prev.map((p) => (p.name === name ? { ...p, value } : p)),
		);
	}

	function addQueryParam() {
		setQueryParams((prev) => [...prev, { name: "", value: "" }]);
	}

	function removeQueryParam(name: string) {
		setQueryParams((prev) => prev.filter((p) => p.name !== name));
	}

	async function handleSend() {
		setSending(true);
		setError(null);
		setLastPayload(null);

		try {
			let parsedHeaders: Record<string, string> = {};
			try {
				parsedHeaders = JSON.parse(headersText);
			} catch {
				setError("Invalid headers JSON");
				setSending(false);
				return;
			}

			let parsedBody: unknown;
			if (bodyText.trim()) {
				try {
					parsedBody = JSON.parse(bodyText);
				} catch {
					setError("Invalid body JSON");
					setSending(false);
					return;
				}
			}

			const response = await runValidation({
				data: {
					specId,
					endpointId,
					url: constructedUrl,
					method,
					headers: parsedHeaders,
					body: parsedBody,
					save: false,
				},
			});

			const validationResult: ValidationResultData = {
				endpointId,
				endpointMethod: endpoint.method,
				endpointPath: endpoint.path,
				responseStatusCode: response.response.statusCode,
				latencyMs: response.response.latencyMs,
				outcome: response.validation.outcome,
				violations: response.validation.violations as Array<
					Record<string, unknown>
				>,
				diff: response.validation.diff as {
					entries: Array<Record<string, unknown>>;
					hasBreaking: boolean;
				},
				responseBody: response.response.body as Record<string, unknown> | null,
				expectedSchema: response.expectedSchema as Record<
					string,
					unknown
				> | null,
			};
			onResult?.(validationResult);
			setLastPayload({
				url: constructedUrl,
				method,
				headers: parsedHeaders,
				body: parsedBody,
			});
		} catch (err) {
			setError(err instanceof Error ? err.message : "Request failed");
		} finally {
			setSending(false);
		}
	}

	async function handleSave() {
		if (!lastPayload) return;
		setSaving(true);
		try {
			const response = await runValidation({
				data: {
					specId,
					endpointId,
					url: lastPayload.url,
					method: lastPayload.method,
					headers: lastPayload.headers,
					body: lastPayload.body,
					save: true,
				},
			});
			if (response.runId) {
				navigate({
					to: "/dashboard/validation/runs/$runId",
					params: { runId: response.runId },
				});
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to save run");
		} finally {
			setSaving(false);
		}
	}

	const hasPathParams = pathParamDefs.length > 0;
	const hasQueryParams = queryParamDefs.length > 0;
	const needsBody = ["POST", "PUT", "PATCH"].includes(method);

	return (
		<div className="flex flex-col gap-4">
			<Card>
				<CardHeader>
					<CardTitle className="text-base">Request</CardTitle>
				</CardHeader>
				<CardContent className="space-y-5">
					<div className="flex flex-col sm:flex-row gap-4">
						<div className="w-full sm:w-28 shrink-0">
							<Label htmlFor="method" className="mb-1.5 block">
								Method
							</Label>
							<Select value={method} onValueChange={setMethod}>
								<SelectTrigger id="method" className="w-full">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{[
										"GET",
										"POST",
										"PUT",
										"PATCH",
										"DELETE",
										"HEAD",
										"OPTIONS",
									].map((m) => (
										<SelectItem key={m} value={m}>
											{m}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="flex-1">
							<Label htmlFor="url" className="mb-1.5 block">
								Base URL
							</Label>
							<div className="relative">
								<Input
									id="url"
									value={urlBase}
									onChange={(e) => setUrlBase(e.target.value)}
									placeholder="https://api.example.com"
									className="font-mono text-xs pr-2"
								/>
								<span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono pointer-events-none truncate max-w-[50%]">
									{endpoint.path}
								</span>
							</div>
						</div>
					</div>

					{hasPathParams && (
						<div>
							<h4 className="text-sm font-medium mb-2">Path Parameters</h4>
							<div className="flex flex-wrap gap-3">
								{pathParams.map((pp) => (
									<div key={pp.name} className="flex flex-col gap-1">
										<Label
											htmlFor={`path-${pp.name}`}
											className="text-xs font-mono text-muted-foreground"
										>
											{pp.name}
										</Label>
										<Input
											id={`path-${pp.name}`}
											value={pp.value}
											onChange={(e) => updatePathParam(pp.name, e.target.value)}
											placeholder={`{${pp.name}}`}
											className="h-7 w-32 font-mono text-xs"
										/>
									</div>
								))}
							</div>
						</div>
					)}

					<div className="rounded bg-muted/30 px-3 py-2 text-xs font-mono break-all">
						{constructedUrl}
					</div>

					<Tabs defaultValue={needsBody ? "body" : "headers"}>
						<TabsList>
							<TabsTrigger value="headers" className="text-xs">
								Headers
							</TabsTrigger>
							{hasQueryParams && (
								<TabsTrigger value="query" className="text-xs">
									Query Params
								</TabsTrigger>
							)}
							{needsBody && (
								<TabsTrigger value="body" className="text-xs">
									Body
								</TabsTrigger>
							)}
						</TabsList>
						<TabsContent value="headers">
							<Label
								htmlFor="headers-input"
								className="mb-1.5 block text-xs text-muted-foreground"
							>
								Headers JSON
							</Label>
							<Textarea
								id="headers-input"
								value={headersText}
								onChange={(e) => setHeadersText(e.target.value)}
								placeholder='{"Authorization": "Bearer ..."}'
								className="font-mono text-xs min-h-[80px]"
							/>
						</TabsContent>
						{hasQueryParams && (
							<TabsContent value="query">
								<div className="space-y-2">
									{queryParams.map((qp) => (
										<div key={qp.name} className="flex items-end gap-2">
											<div className="flex flex-col gap-1">
												<Label
													htmlFor={`qp-key-${qp.name}`}
													className="text-xs text-muted-foreground"
												>
													Key
												</Label>
												<Input
													id={`qp-key-${qp.name}`}
													value={qp.name}
													onChange={(e) => {
														const oldName = qp.name;
														removeQueryParam(oldName);
														addQueryParam();
														updateQueryParam(e.target.value, qp.value);
													}}
													placeholder="key"
													className="h-7 w-36 font-mono text-xs"
												/>
											</div>
											<div className="flex flex-col gap-1">
												<Label
													htmlFor={`qp-value-${qp.name}`}
													className="text-xs text-muted-foreground"
												>
													Value
												</Label>
												<Input
													id={`qp-value-${qp.name}`}
													value={qp.value}
													onChange={(e) =>
														updateQueryParam(qp.name, e.target.value)
													}
													placeholder="value"
													className="h-7 w-36 font-mono text-xs"
												/>
											</div>
											<button
												type="button"
												onClick={() => removeQueryParam(qp.name)}
												className="text-muted-foreground hover:text-foreground mb-0.5"
											>
												<X className="size-3.5" />
											</button>
										</div>
									))}
									<Button
										variant="ghost"
										size="sm"
										onClick={addQueryParam}
										className="text-xs gap-1"
									>
										<Plus className="size-3" />
										Add param
									</Button>
								</div>
							</TabsContent>
						)}
						{needsBody && (
							<TabsContent value="body">
								<Label className="mb-1.5 block text-xs text-muted-foreground">
									Request Body JSON
								</Label>
								<MonacoEditor
									value={bodyText}
									onChange={setBodyText}
									language="json"
									height="200px"
								/>
							</TabsContent>
						)}
					</Tabs>

					{error && (
						<div className="rounded bg-red-500/10 px-3 py-2 text-xs text-red-500">
							{error}
						</div>
					)}

					<div className="flex items-center gap-2">
						<Button onClick={handleSend} disabled={sending || !constructedUrl}>
							<Send className="size-4" />
							{sending ? "Sending..." : "Send Request"}
						</Button>
						{lastPayload && (
							<Button variant="outline" onClick={handleSave} disabled={saving}>
								<Save className="size-4" />
								{saving ? "Saving..." : "Save Run"}
							</Button>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
