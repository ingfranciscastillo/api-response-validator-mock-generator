import { createFileRoute } from "@tanstack/react-router";
import { Copy, Key, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "#/components/ui/badge";
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
import {
	createApiKey,
	listApiKeys,
	revokeApiKey,
} from "#/lib/workspace/functions";

export const Route = createFileRoute("/dashboard/settings/api-keys")({
	component: ApiKeysPage,
});

function ApiKeysPage() {
	const [keys, setKeys] = useState<Awaited<ReturnType<typeof listApiKeys>>>([]);
	const [loading, setLoading] = useState(true);
	const [showCreate, setShowCreate] = useState(false);
	const [newName, setNewName] = useState("");
	const [newScope, setNewScope] = useState("mocks:read");
	const [creating, setCreating] = useState(false);
	const [newKeyRaw, setNewKeyRaw] = useState("");

	const fetchKeys = () => {
		setLoading(true);
		listApiKeys({ data: { workspaceId: "" } })
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
				data: { workspaceId: "", name: newName, scopes: [newScope] },
			});
			setNewKeyRaw(result.rawKey);
			setNewName("");
			fetchKeys();
		} finally {
			setCreating(false);
		}
	};

	const handleRevoke = async (keyId: string) => {
		await revokeApiKey({ data: { workspaceId: "", keyId } });
		fetchKeys();
	};

	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text);
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
									<Label>Scope</Label>
									<Select value={newScope} onValueChange={setNewScope}>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="mocks:read">mocks:read</SelectItem>
											<SelectItem value="mocks:write">mocks:write</SelectItem>
											<SelectItem value="validation:read">
												validation:read
											</SelectItem>
											<SelectItem value="validation:write">
												validation:write
											</SelectItem>
										</SelectContent>
									</Select>
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
				<div className="flex items-center justify-center py-12">
					<div className="size-8 animate-pulse rounded-full bg-muted" />
				</div>
			) : keys.length === 0 ? (
				<div className="rounded-lg border border-border bg-surface p-8 text-center">
					<p className="text-text-tertiary">No API keys</p>
				</div>
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
