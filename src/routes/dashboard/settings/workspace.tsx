import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Separator } from "#/components/ui/separator";
import { authClient } from "#/lib/auth-client";
import { updateWorkspace } from "#/lib/workspace/functions";

export const Route = createFileRoute("/dashboard/settings/workspace")({
	component: WorkspacePage,
});

function WorkspacePage() {
	const { data: session } = authClient.useSession();
	const sessionOrg = session?.session?.activeOrganizationId;
	const [name, setName] = useState("");
	const [slug, setSlug] = useState("");
	const [saving, setSaving] = useState(false);
	const [saved, setSaved] = useState(false);

	useEffect(() => {
		if (sessionOrg) {
			const org = session?.session?.activeOrganization;
			if (org) {
				setName(org.name ?? "");
				setSlug(org.slug ?? "");
			}
		}
	}, [session, sessionOrg]);

	const handleSave = async () => {
		setSaving(true);
		try {
			await updateWorkspace({
				data: { organizationId: "", name, slug },
			});
			setSaved(true);
			setTimeout(() => setSaved(false), 2000);
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="flex flex-col gap-4 max-w-lg">
			<Card>
				<CardHeader>
					<CardTitle className="text-sm">Workspace Settings</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-1">
						<Label>Name</Label>
						<Input value={name} onChange={(e) => setName(e.target.value)} />
					</div>
					<div className="space-y-1">
						<Label>Slug</Label>
						<Input value={slug} onChange={(e) => setSlug(e.target.value)} />
					</div>
					<Button onClick={handleSave} disabled={saving}>
						{saved ? "Saved!" : saving ? "Saving..." : "Save"}
					</Button>
				</CardContent>
			</Card>

			<Separator />

			<Card className="border-red-200">
				<CardHeader>
					<CardTitle className="text-sm text-red-600">Danger Zone</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-text-secondary mb-3">
						Permanently delete this workspace and all its data.
					</p>
					<Button variant="destructive" size="sm" disabled>
						Delete Workspace
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
