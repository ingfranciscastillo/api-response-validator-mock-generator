import { Send } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs";
import { Textarea } from "#/components/ui/textarea";
import { runValidation } from "#/lib/validation/functions";
import type { ValidationResultData } from "./validation-result-card";
import { ValidationResultCard } from "./validation-result-card";

interface RequestBuilderProps {
	specId: string;
	endpointId: string;
	initialMethod?: string;
}

export function ValidationRequestBuilder({
	specId,
	endpointId,
	initialMethod = "GET",
}: RequestBuilderProps) {
	const [method, setMethod] = useState(initialMethod);
	const [url, setUrl] = useState("");
	const [headersText, setHeadersText] = useState("{}");
	const [bodyText, setBodyText] = useState("");
	const [sending, setSending] = useState(false);
	const [result, setResult] = useState<ValidationResultData | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		setMethod(initialMethod);
	}, [initialMethod]);

	async function handleSend() {
		setSending(true);
		setError(null);
		setResult(null);

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
					url,
					method,
					headers: parsedHeaders,
					body: parsedBody,
					save: false,
				},
			});

			setResult({
				endpointId,
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
			});
		} catch (err) {
			setError(err instanceof Error ? err.message : "Request failed");
		} finally {
			setSending(false);
		}
	}

	return (
		<div className="flex flex-col gap-4">
			<Card>
				<CardHeader>
					<CardTitle className="text-base">Request</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					<div className="flex gap-2">
						<div className="w-24 shrink-0">
							<Label htmlFor="method">Method</Label>
							<select
								id="method"
								value={method}
								onChange={(e) => setMethod(e.target.value)}
								className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
							>
								{[
									"GET",
									"POST",
									"PUT",
									"PATCH",
									"DELETE",
									"HEAD",
									"OPTIONS",
								].map((m) => (
									<option key={m} value={m}>
										{m}
									</option>
								))}
							</select>
						</div>
						<div className="flex-1">
							<Label htmlFor="url">URL</Label>
							<Input
								id="url"
								value={url}
								onChange={(e) => setUrl(e.target.value)}
								placeholder="https://api.example.com/users"
							/>
						</div>
					</div>

					<Tabs defaultValue="headers">
						<TabsList>
							<TabsTrigger value="headers" className="text-xs">
								Headers
							</TabsTrigger>
							<TabsTrigger value="body" className="text-xs">
								Body
							</TabsTrigger>
						</TabsList>
						<TabsContent value="headers">
							<Textarea
								value={headersText}
								onChange={(e) => setHeadersText(e.target.value)}
								placeholder='{"Authorization": "Bearer ..."}'
								className="font-mono text-xs min-h-[80px]"
							/>
						</TabsContent>
						<TabsContent value="body">
							<Textarea
								value={bodyText}
								onChange={(e) => setBodyText(e.target.value)}
								placeholder='{"key": "value"}'
								className="font-mono text-xs min-h-[120px]"
							/>
						</TabsContent>
					</Tabs>

					{error && (
						<div className="rounded bg-red-500/10 px-3 py-2 text-xs text-red-500">
							{error}
						</div>
					)}

					<Button onClick={handleSend} disabled={sending || !url}>
						<Send className="size-4" />
						{sending ? "Sending..." : "Send Request"}
					</Button>
				</CardContent>
			</Card>

			{result && (
				<div>
					<h4 className="text-sm font-medium mb-2">Response</h4>
					<ValidationResultCard result={result} expanded />
				</div>
			)}
		</div>
	);
}
