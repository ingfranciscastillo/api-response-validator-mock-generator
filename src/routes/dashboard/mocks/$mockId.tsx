import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, FlaskConical, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
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
	component: MockDetailPage,
});

function MockDetailPage() {
	const { mockId } = Route.useParams();
	const navigate = useNavigate();
	const [data, setData] = useState<Awaited<ReturnType<typeof getMock>> | null>(
		null,
	);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [latencyMs, setLatencyMs] = useState(0);
	const [deleting, setDeleting] = useState(false);

	useEffect(() => {
		getMock({ data: { mockId } })
			.then((result) => {
				setData(result);
				if (result?.servingConfig) {
					setLatencyMs(result.servingConfig.latencyMs);
				}
			})
			.catch((err) =>
				setError(err instanceof Error ? err.message : "Failed to load mock"),
			)
			.finally(() => setLoading(false));
	}, [mockId]);

	const handleToggleServing = async (isEnabled: boolean) => {
		await toggleMockServing({
			data: { mockId, isEnabled },
		});
		setData((prev) =>
			prev
				? {
						...prev,
						servingConfig: prev.servingConfig
							? { ...prev.servingConfig, isEnabled }
							: {
									id: "",
									workspaceId: "",
									mockDatasetId: mockId,
									isEnabled,
									latencyMs: 0,
									responseHeadersOverride: null,
									createdAt: new Date(),
								},
					}
				: prev,
		);
	};

	const handleUpdateLatency = async () => {
		await updateServingConfig({
			data: { mockId, latencyMs },
		});
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
					<Link to="/dashboard/mocks">Back to Mocks</Link>
				</Button>
			</div>
		);
	}

	if (!data || !data.mock) {
		return (
			<div className="flex flex-col items-center gap-4 py-12">
				<p className="text-muted-foreground">Mock not found</p>
				<Button asChild>
					<Link to="/dashboard/mocks">Back to Mocks</Link>
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
							Created {new Date(mock.createdAt).toLocaleString()}
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
					{deleting ? "Deleting..." : "Delete"}
				</Button>
			</div>

			<MockPayloadViewer
				payload={(mock.payload ?? {}) as JsonValue}
				title="Mock Payload"
			/>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-sm">
						<FlaskConical className="size-4" />
						Serving Configuration
					</CardTitle>
					<CardDescription>
						Control how this mock is served via the public API
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<Label>Public Serving</Label>
							<p className="text-sm text-muted-foreground">
								Enable to make this mock available at the public endpoint
							</p>
						</div>
						<Switch
							checked={servingConfig?.isEnabled ?? false}
							onCheckedChange={handleToggleServing}
						/>
					</div>

					<Separator />

					<div className="flex items-end gap-4">
						<div className="space-y-2 flex-1">
							<Label>Latency (ms)</Label>
							<Input
								type="number"
								value={latencyMs}
								onChange={(e) => setLatencyMs(Number(e.target.value))}
								min={0}
								max={10000}
							/>
						</div>
						<Button variant="outline" size="sm" onClick={handleUpdateLatency}>
							Update
						</Button>
					</div>

					{servingConfig?.isEnabled && (
						<div className="rounded-md bg-muted p-3">
							<p className="text-xs text-muted-foreground">
								Public URL:{" "}
								<code className="font-mono">/api/public/mocks/{mock.id}</code>
							</p>
						</div>
					)}
				</CardContent>
			</Card>

			<CommentsSection entityType="mock_dataset" entityId={mockId} />

			<Card>
				<CardHeader>
					<CardTitle className="text-sm">Details</CardTitle>
				</CardHeader>
				<CardContent>
					<dl className="grid grid-cols-2 gap-4 text-sm">
						<div>
							<dt className="text-muted-foreground">Status Code</dt>
							<dd>{mock.statusCode}</dd>
						</div>
						<div>
							<dt className="text-muted-foreground">Variant Type</dt>
							<dd>
								<Badge variant="secondary">
									{mock.variantType.replace("_", " ")}
								</Badge>
							</dd>
						</div>
						{mock.variantLabel && (
							<div>
								<dt className="text-muted-foreground">Variant Label</dt>
								<dd>{mock.variantLabel}</dd>
							</div>
						)}
						{mock.seed && (
							<div>
								<dt className="text-muted-foreground">Seed</dt>
								<dd className="font-mono">{mock.seed}</dd>
							</div>
						)}
					</dl>
				</CardContent>
			</Card>
		</div>
	);
}
