import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
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
import { authClient, organization } from "#/lib/auth-client";
import { deleteWorkspace, updateWorkspace } from "#/lib/workspace/functions";

export const Route = createFileRoute("/dashboard/settings/workspace")({
	head: () => ({
		meta: [
			{
				title: "Workspace Settings — API Response Validator & Mock Generator",
			},
		],
	}),
	component: WorkspacePage,
});

type Org = { id: string; name: string; slug: string; logo: string | null };

function WorkspacePage() {
	const { t } = useTranslation();
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
			organization.list().then(({ data }) => {
				const org = (data as Org[])?.find((o) => o.id === sessionOrg);
				if (org) {
					setName(org.name ?? "");
					setSlug(org.slug ?? "");
				}
			});
		}
	}, [sessionOrg]);

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
					<CardTitle className="text-sm">
						{t("dashboard:settings.workspaceSettings")}
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label>{t("common:name")}</Label>
						<Input value={name} onChange={(e) => setName(e.target.value)} />
					</div>
					<div className="space-y-2">
						<Label>{t("dashboard:settings.workspaceSlug")}</Label>
						<Input value={slug} onChange={(e) => setSlug(e.target.value)} />
					</div>
					<Button onClick={handleSave} disabled={saving}>
						{saved
							? t("common:saved")
							: saving
								? t("common:saving")
								: t("common:save")}
					</Button>
				</CardContent>
			</Card>

			<Separator />

			<Card className="border-red-200">
				<CardHeader>
					<CardTitle className="text-sm text-red-600">
						{t("dashboard:settings.dangerZone")}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-text-secondary mb-3">
						{t("dashboard:settings.deleteWorkspaceDescription")}
					</p>
					<Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
						<DialogTrigger asChild>
							<Button variant="destructive" size="sm">
								<Trash2 className="size-4 mr-1" />
								{t("dashboard:settings.deleteWorkspace")}
							</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>
									{t("dashboard:settings.deleteWorkspace")}
								</DialogTitle>
								<DialogDescription>
									{t("dashboard:settings.deleteWorkspaceConfirmDescription")}
								</DialogDescription>
							</DialogHeader>
							<DialogFooter>
								<Button
									variant="outline"
									onClick={() => setDeleteDialogOpen(false)}
									disabled={deleting}
								>
									{t("common:cancel")}
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
									{deleting
										? t("dashboard:settings.deletingWorkspace")
										: t("dashboard:settings.deleteForever")}
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</CardContent>
			</Card>
		</div>
	);
}
