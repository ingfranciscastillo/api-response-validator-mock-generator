import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Separator } from "#/components/ui/separator";
import { authClient } from "#/lib/auth-client";

export const Route = createFileRoute("/dashboard/settings/account")({
	head: () => ({
		meta: [
			{
				title: "Account Settings — API Response Validator & Mock Generator",
			},
		],
	}),
	component: AccountPage,
});

function AccountPage() {
	const { t } = useTranslation();
	const { data: session } = authClient.useSession();
	const [name, setName] = useState("");
	const [saving, setSaving] = useState(false);
	const [saved, setSaved] = useState(false);

	useEffect(() => {
		if (session?.user) setName(session.user.name ?? "");
	}, [session]);

	const handleSave = async () => {
		setSaving(true);
		try {
			await authClient.updateUser({ name });
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
						{t("dashboard:settings.profileSection")}
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label>{t("common:email")}</Label>
						<Input value={session?.user.email ?? ""} disabled />
					</div>
					<div className="space-y-2">
						<Label>{t("common:name")}</Label>
						<Input value={name} onChange={(e) => setName(e.target.value)} />
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

			<Card>
				<CardHeader>
					<CardTitle className="text-sm">
						{t("dashboard:settings.sessionsCardTitle")}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<Button
						variant="outline"
						size="sm"
						onClick={() => authClient.revokeSessions()}
					>
						{t("dashboard:settings.signOutAllSessions")}
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
