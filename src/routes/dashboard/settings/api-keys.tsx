import { createFileRoute } from "@tanstack/react-router";
import { Copy, Key, KeyRound, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { EmptyState } from "#/components/ui/empty-state";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Skeleton } from "#/components/ui/skeleton";
import {
	createApiKey,
	listApiKeys,
	revokeApiKey,
} from "#/lib/workspace/functions";

export const Route = createFileRoute("/dashboard/settings/api-keys")({
	component: ApiKeysPage,
});

const ALL_SCOPES = [
	"mocks:read",
	"mocks:write",
	"validation:read",
	"validation:write",
	"specs:read",
	"specs:write",
] as const;

function ApiKeysPage() {
	const [keys, setKeys] = useState<Awaited<ReturnType<typeof listApiKeys>>>([]);
	const [loading, setLoading] = useState(true);
	const [showCreate, setShowCreate] = useState(false);
	const [newName, setNewName] = useState("");
	const [selectedScopes, setSelectedScopes] = useState<Set<string>>(
		new Set(["mocks:read"]),
	);
	const [expiryDate, setExpiryDate] = useState("");
	const [creating, setCreating] = useState(false);
	const [newKeyRaw, setNewKeyRaw] = useState("");

	const fetchKeys = () => {
		setLoading(true);
		listApiKeys()
			.then((k) => setKeys(k as typeof keys))
			.finally(() => setLoading(false));
	};

	useEffect(() => {
		fetchKeys();
	}, []);

	const handleCreate = async () => {
		if (!newName) return;
		setCreating(true);
		try {
			const result = await createApiKey({
				data: {
					name: newName,
					scopes: Array.from(selectedScopes),
					expiresAt: expiryDate || undefined,
				},
			});
			setNewKeyRaw(result.rawKey);
			setNewName("");
			setSelectedScopes(new Set(["mocks:read"]));
			setExpiryDate("");
			fetchKeys();
		} finally {
			setCreating(false);
		}
	};

	const handleRevoke = async (keyId: string) => {
		await revokeApiKey({ data: { keyId } });
		fetchKeys();
	};

	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text);
	};

	const toggleScope = (scope: string) => {
		setSelectedScopes((prev) => {
			const next = new Set(prev);
			if (next.has(scope)) {
				next.delete(scope);
			} else {
				next.add(scope);
			}
			return next;
		});
	};

	return (
		<div className="flex flex-col gap-4 max-w-lg">
			<div className="flex items-center justify-between">
				<p className="text-sm text-text-secondary">
					{keys.length} key{keys.length !== 1 ? "s" : ""}
				</p>
				<Button size="sm" onClick={() => setShowCreate(!showCreate)}>
					<Key className="size-4 mr-1" />
					Create Key
				</Button>
			</div>

			{showCreate && (
				<Card>
					<CardHeader>
						<CardTitle className="text-sm">New API Key</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						{newKeyRaw ? (
							<div className="space-y-2">
								<Label>Your API Key (copy now — won't be shown again)</Label>
								<div className="flex gap-2">
									<Input value={newKeyRaw} readOnly />
									<Button
										variant="outline"
										size="icon"
										onClick={() => copyToClipboard(newKeyRaw)}
									>
										<Copy className="size-4" />
									</Button>
								</div>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => {
										setNewKeyRaw("");
										setShowCreate(false);
									}}
								>
									Done
								</Button>
							</div>
						) : (
							<div className="space-y-3">
								<div className="space-y-1">
									<Label>Name</Label>
									<Input
										placeholder="e.g. CI Pipeline"
										value={newName}
										onChange={(e) => setNewName(e.target.value)}
									/>
								</div>
								<div className="space-y-1">
									<Label>Scopes</Label>
									<div className="grid grid-cols-2 gap-2">
										{ALL_SCOPES.map((scope) => (
											<label
												key={scope}
												className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm cursor-pointer hover:bg-muted/50 has-checked:border-accent-blue has-checked:bg-accent-blue/5"
											>
												<input
													type="checkbox"
													checked={selectedScopes.has(scope)}
													onChange={() => toggleScope(scope)}
													className="size-4 rounded border-input accent-accent-blue"
												/>
												<code className="text-xs font-mono">{scope}</code>
											</label>
										))}
									</div>
								</div>
								<div className="space-y-1">
									<Label>Expiry (optional)</Label>
									<Input
										type="date"
										value={expiryDate}
										onChange={(e) => setExpiryDate(e.target.value)}
									/>
								</div>
								<Button onClick={handleCreate} disabled={!newName || creating}>
									{creating ? "Creating..." : "Generate Key"}
								</Button>
							</div>
						)}
					</CardContent>
				</Card>
			)}

			{loading ? (
				<div className="space-y-2">
					{Array.from({ length: 2 }).map((_, i) => (
						<Card key={i}>
							<CardContent className="py-3">
								<div className="space-y-1.5">
									<Skeleton className="h-4 w-32" />
									<Skeleton className="h-3 w-48" />
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			) : keys.length === 0 ? (
				<EmptyState
					icon={<KeyRound className="size-8" />}
					title="No API keys"
					description="Create an API key to integrate with external tools"
				/>
			) : (
				<div className="space-y-2">
					{keys.map((key) => (
						<Card key={key.id}>
							<CardContent className="flex items-center justify-between py-3">
								<div>
									<p className="text-sm font-medium">{key.name}</p>
									<div className="flex items-center gap-2 mt-0.5">
										<code className="text-xs bg-muted px-1 py-0.5 rounded font-mono">
											{key.keyPrefix}...
										</code>
										{Array.isArray(key.scopes) &&
											key.scopes.map((s: string) => (
												<Badge key={s} variant="outline" className="text-xs">
													{s}
												</Badge>
											))}
										{key.lastUsedAt && (
											<span className="text-xs text-text-tertiary">
												Last used:{" "}
												{new Date(key.lastUsedAt).toLocaleDateString()}
											</span>
										)}
										{key.expiresAt && (
											<span className="text-xs text-text-tertiary">
												Expires: {new Date(key.expiresAt).toLocaleDateString()}
											</span>
										)}
									</div>
								</div>
								<Button
									variant="ghost"
									size="icon-xs"
									onClick={() => handleRevoke(key.id)}
								>
									<Trash2 className="size-4 text-red-500" />
								</Button>
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}
