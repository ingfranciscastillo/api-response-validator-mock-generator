import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Separator } from "#/components/ui/separator";
import { authClient } from "#/lib/auth-client";

export const Route = createFileRoute("/dashboard/settings/account")({
	component: AccountPage,
});

function AccountPage() {
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
					<CardTitle className="text-sm">Profile</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-1">
						<Label>Email</Label>
						<Input value={session?.user.email ?? ""} disabled />
					</div>
					<div className="space-y-1">
						<Label>Name</Label>
						<Input value={name} onChange={(e) => setName(e.target.value)} />
					</div>
					<Button onClick={handleSave} disabled={saving}>
						{saved ? "Saved!" : saving ? "Saving..." : "Save"}
					</Button>
				</CardContent>
			</Card>

			<Separator />

			<Card>
				<CardHeader>
					<CardTitle className="text-sm">Sessions</CardTitle>
				</CardHeader>
				<CardContent>
					<Button
						variant="outline"
						size="sm"
						onClick={() => authClient.revokeSessions()}
					>
						Sign out all sessions
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
