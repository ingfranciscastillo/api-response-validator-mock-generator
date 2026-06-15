import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Separator } from "#/components/ui/separator";
import { authClient } from "#/lib/auth-client";
import { deleteWorkspace, updateWorkspace } from "#/lib/workspace/functions";

export const Route = createFileRoute("/dashboard/settings/workspace")({
	component: WorkspacePage,
});

function WorkspacePage() {
	const router = useRouter();
	const { data: session } = authClient.useSession();
	const sessionOrg = session?.session?.activeOrganizationId;
	const [name, setName] = useState("");
	const [slug, setSlug] = useState("");
	const [saving, setSaving] = useState(false);
	const [saved, setSaved] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [deleting, setDeleting] = useState(false);

	useEffect(() => {
		if (sessionOrg) {
			const org = session?.session?.activeOrganization;
			if (org) {
				setName(org.name ?? "");
				setSlug(org.slug ?? "");
			}
		}
	}, [session, sessionOrg]);

	if (!sessionOrg) return null;

	const handleSave = async () => {
		setSaving(true);
		try {
			await updateWorkspace({
				data: { name, slug },
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
					<Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
						<DialogTrigger asChild>
							<Button variant="destructive" size="sm">
								<Trash2 className="size-4 mr-1" />
								Delete Workspace
							</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Delete Workspace</DialogTitle>
								<DialogDescription>
									This action is irreversible. All data including
									specifications, validation runs, mocks, and team members will
									be permanently deleted.
								</DialogDescription>
							</DialogHeader>
							<DialogFooter>
								<Button
									variant="outline"
									onClick={() => setDeleteDialogOpen(false)}
									disabled={deleting}
								>
									Cancel
								</Button>
								<Button
									variant="destructive"
									disabled={deleting || !sessionOrg}
									onClick={async () => {
										setDeleting(true);
										try {
											await deleteWorkspace({
												data: { workspaceId: sessionOrg },
											});
											router.navigate({ to: "/" });
										} catch {
											setDeleteDialogOpen(false);
										} finally {
											setDeleting(false);
										}
									}}
								>
									{deleting ? "Deleting..." : "Delete Forever"}
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</CardContent>
			</Card>
		</div>
	);
}
