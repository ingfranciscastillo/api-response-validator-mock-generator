import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Copy, FlaskConical, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { MockPayloadViewer } from "#/components/mocks/mock-payload-viewer";
import { CommentsSection } from "#/components/shared/CommentsSection";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Separator } from "#/components/ui/separator";
import { Switch } from "#/components/ui/switch";
import type { JsonValue } from "#/lib/mocks/engine";
import {
	deleteMock,
	getMock,
	toggleMockServing,
	updateServingConfig,
} from "#/lib/mocks/functions";

export const Route = createFileRoute("/dashboard/mocks/$mockId")({
	head: () => ({
		meta: [
			{
				title: "Mock Details — API Response Validator & Mock Generator",
			},
		],
	}),
	component: MockDetailPage,
});

type HeaderPair = { key: string; value: string };

function MockDetailPage() {
	const { t } = useTranslation();
	const { mockId } = Route.useParams();
	const navigate = useNavigate();
	const [data, setData] = useState<Awaited<ReturnType<typeof getMock>> | null>(
		null,
	);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [latencyMs, setLatencyMs] = useState(0);
	const [deleting, setDeleting] = useState(false);

	const [isToggling, setIsToggling] = useState(false);
	const [isUpdating, setIsUpdating] = useState(false);
	const [toggleError, setToggleError] = useState<string | null>(null);
	const [latencyError, setLatencyError] = useState<string | null>(null);
	const [curlCopied, setCurlCopied] = useState(false);

	const [headerOverrides, setHeaderOverrides] = useState<HeaderPair[]>([]);

	useEffect(() => {
		getMock({ data: { mockId } })
			.then((result) => {
				setData(result);
				if (result?.servingConfig) {
					setLatencyMs(result.servingConfig.latencyMs);
					setHeaderOverrides(
						toHeaderPairs(result.servingConfig.responseHeadersOverride),
					);
				}
			})
			.catch((err) =>
				setError(err instanceof Error ? err.message : "Failed to load mock"),
			)
			.finally(() => setLoading(false));
	}, [mockId]);

	const handleToggleServing = async (isEnabled: boolean) => {
		setIsToggling(true);
		setToggleError(null);
		try {
			await toggleMockServing({ data: { mockId, isEnabled } });
			const result = await getMock({ data: { mockId } });
			setData(result);
			if (result?.servingConfig) {
				setLatencyMs(result.servingConfig.latencyMs);
				setHeaderOverrides(
					toHeaderPairs(result.servingConfig.responseHeadersOverride),
				);
			}
		} catch (err) {
			setToggleError(
				err instanceof Error ? err.message : "Failed to update serving",
			);
		} finally {
			setIsToggling(false);
		}
	};

	const handleUpdateLatency = async () => {
		setIsUpdating(true);
		setLatencyError(null);
		try {
			const overrideObj = pairsToRecord(headerOverrides);
			await updateServingConfig({
				data: {
					mockId,
					latencyMs,
					responseHeadersOverride: overrideObj,
				},
			});
			const result = await getMock({ data: { mockId } });
			setData(result);
		} catch (err) {
			setLatencyError(
				err instanceof Error ? err.message : "Failed to update configuration",
			);
		} finally {
			setIsUpdating(false);
		}
	};

	const handleCopyCurl = async () => {
		const host = window.location.origin;
		const curl = `curl -H "Authorization: Bearer <your-api-key>" ${host}/api/public/mocks/${mockId}`;
		try {
			await navigator.clipboard.writeText(curl);
			setCurlCopied(true);
			setTimeout(() => setCurlCopied(false), 2000);
		} catch {
			// clipboard not available
		}
	};

	const addHeaderRow = () => {
		setHeaderOverrides((prev) => [...prev, { key: "", value: "" }]);
	};

	const updateHeaderRow = (
		index: number,
		field: "key" | "value",
		val: string,
	) => {
		setHeaderOverrides((prev) => {
			const next = [...prev];
			next[index] = { ...next[index], [field]: val };
			return next;
		});
	};

	const removeHeaderRow = (index: number) => {
		setHeaderOverrides((prev) => prev.filter((_, i) => i !== index));
	};

	const handleDelete = async () => {
		setDeleting(true);
		await deleteMock({ data: { mockId } });
		navigate({ to: "/dashboard/mocks" });
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
					<Link to="/dashboard/mocks">{t("dashboard:mocks.backToMocks")}</Link>
				</Button>
			</div>
		);
	}

	if (!data || !data.mock) {
		return (
			<div className="flex flex-col items-center gap-4 py-12">
				<p className="text-muted-foreground">
					{t("dashboard:mocks.mockNotFound")}
				</p>
				<Button asChild>
					<Link to="/dashboard/mocks">{t("dashboard:mocks.backToMocks")}</Link>
				</Button>
			</div>
		);
	}

	const { mock, servingConfig } = data;

	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<Button variant="ghost" size="icon" asChild>
						<Link to="/dashboard/mocks">
							<ArrowLeft className="size-4" />
						</Link>
					</Button>
					<div>
						<h2 className="text-2xl font-bold">{mock.name}</h2>
						<p className="text-muted-foreground text-sm mt-1">
							{t("dashboard:mocks.createdLabel")}{" "}
							{new Date(mock.createdAt).toLocaleString()}
						</p>
					</div>
				</div>
				<Button
					variant="destructive"
					size="sm"
					onClick={handleDelete}
					disabled={deleting}
					className="gap-1"
				>
					<Trash2 className="size-3.5" />
					{deleting ? t("dashboard:mocks.deleting") : t("common:delete")}
				</Button>
			</div>

			<MockPayloadViewer
				payload={(mock.payload ?? {}) as JsonValue}
				title={t("dashboard:mocks.mockPayload")}
			/>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-sm">
						<FlaskConical className="size-4" />
						{t("dashboard:mocks.servingConfiguration")}
					</CardTitle>
					<CardDescription>
						{t("dashboard:mocks.servingConfigurationDescription")}
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<Label>{t("dashboard:mocks.publicServing")}</Label>
							<p className="text-sm text-muted-foreground">
								{t("dashboard:mocks.publicServingDescription")}
							</p>
						</div>
						<Switch
							checked={servingConfig?.isEnabled ?? false}
							onCheckedChange={handleToggleServing}
							disabled={isToggling}
						/>
					</div>
					{toggleError && (
						<p className="text-xs text-destructive">{toggleError}</p>
					)}

					<Separator />

					<div className="flex items-end gap-4">
						<div className="space-y-2 flex-1">
							<Label>{t("dashboard:mocks.latency")}</Label>
							<Input
								type="number"
								value={latencyMs}
								onChange={(e) => setLatencyMs(Number(e.target.value))}
								min={0}
								max={10000}
							/>
						</div>
						<Button
							variant="outline"
							size="sm"
							onClick={handleUpdateLatency}
							disabled={isUpdating}
						>
							{isUpdating ? t("common:saving") : t("common:update")}
						</Button>
					</div>
					{latencyError && (
						<p className="text-xs text-destructive">{latencyError}</p>
					)}

					<Separator />

					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<Label>{t("dashboard:mocks.responseHeaderOverrides")}</Label>
							<Button
								variant="outline"
								size="sm"
								onClick={addHeaderRow}
								className="gap-1"
							>
								<Plus className="size-3" />
								{t("dashboard:mocks.addHeader")}
							</Button>
						</div>
						{headerOverrides.length === 0 && (
							<p className="text-sm text-muted-foreground">
								{t("dashboard:mocks.noCustomHeaders")}
							</p>
						)}
						{headerOverrides.map((pair, i) => (
							<div key={i} className="flex items-center gap-2">
								<Input
									placeholder={t("dashboard:mocks.headerName")}
									value={pair.key}
									onChange={(e) => updateHeaderRow(i, "key", e.target.value)}
									className="flex-1"
								/>
								<Input
									placeholder={t("dashboard:mocks.headerValue")}
									value={pair.value}
									onChange={(e) => updateHeaderRow(i, "value", e.target.value)}
									className="flex-1"
								/>
								<Button
									variant="ghost"
									size="icon"
									onClick={() => removeHeaderRow(i)}
								>
									<X className="size-4" />
								</Button>
							</div>
						))}
					</div>

					{servingConfig?.isEnabled && (
						<div className="rounded-md bg-muted p-3 flex items-center justify-between gap-2">
							<p className="text-xs text-muted-foreground break-all">
								{t("dashboard:mocks.publicUrl")}{" "}
								<code className="font-mono">/api/public/mocks/{mock.id}</code>
							</p>
							<Button
								variant="outline"
								size="sm"
								onClick={handleCopyCurl}
								className="shrink-0 gap-1"
							>
								<Copy className="size-3" />
								{curlCopied
									? t("common:copied")
									: t("dashboard:mocks.copyCurl")}
							</Button>
						</div>
					)}
				</CardContent>
			</Card>

			<CommentsSection entityType="mock_dataset" entityId={mockId} />

			<Card>
				<CardHeader>
					<CardTitle className="text-sm">
						{t("dashboard:mocks.details")}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<dl className="grid grid-cols-2 gap-4 text-sm">
						<div>
							<dt className="text-muted-foreground">
								{t("dashboard:mocks.statusCode")}
							</dt>
							<dd>{mock.statusCode}</dd>
						</div>
						<div>
							<dt className="text-muted-foreground">
								{t("dashboard:mocks.variantType")}
							</dt>
							<dd>
								<Badge variant="secondary">
									{mock.variantType.replace("_", " ")}
								</Badge>
							</dd>
						</div>
						{mock.variantLabel && (
							<div>
								<dt className="text-muted-foreground">
									{t("dashboard:mocks.variantLabel")}
								</dt>
								<dd>{mock.variantLabel}</dd>
							</div>
						)}
						{mock.seed && (
							<div>
								<dt className="text-muted-foreground">
									{t("dashboard:mocks.seed")}
								</dt>
								<dd className="font-mono">{mock.seed}</dd>
							</div>
						)}
					</dl>
				</CardContent>
			</Card>
		</div>
	);
}

function toHeaderPairs(value: unknown): HeaderPair[] {
	if (!value || typeof value !== "object") return [];
	return Object.entries(value).map(([key, val]) => ({
		key,
		value: String(val ?? ""),
	}));
}

function pairsToRecord(pairs: HeaderPair[]): Record<string, string> | null {
	const filtered = pairs.filter((p) => p.key.trim() !== "");
	if (filtered.length === 0) return null;
	const record: Record<string, string> = {};
	for (const { key, value } of filtered) {
		record[key.trim()] = value;
	}
	return record;
}
