import { createFileRoute } from "@tanstack/react-router";
import { Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Separator } from "#/components/ui/separator";
import { Skeleton } from "#/components/ui/skeleton";
import { listUserSessions } from "#/lib/auth.functions";
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

			<ActiveSessionsCard />
		</div>
	);
}

function ActiveSessionsCard() {
	const { t } = useTranslation();
	const [sessions, setSessions] = useState<
		{
			id: string;
			createdAt: Date | null;
			userAgent: string | null;
			ipAddress: string | null;
		}[]
	>([]);
	const [loading, setLoading] = useState(true);
	const [revoking, setRevoking] = useState(false);

	const fetchSessions = () => {
		setLoading(true);
		listUserSessions()
			.then(setSessions)
			.finally(() => setLoading(false));
	};

	useEffect(() => {
		fetchSessions();
	}, []);

	const handleRevokeAll = async () => {
		setRevoking(true);
		try {
			await authClient.revokeSessions();
			fetchSessions();
		} finally {
			setRevoking(false);
		}
	};

	const formatUserAgent = (ua: string | null) => {
		if (!ua) return t("dashboard:settings.unknownDevice");
		if (ua.includes("Chrome")) return "Chrome";
		if (ua.includes("Firefox")) return "Firefox";
		if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
		if (ua.includes("Edge")) return "Edge";
		if (ua.includes("Mobile")) return "Mobile browser";
		return ua.slice(0, 40);
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-sm flex items-center gap-2">
					<Shield className="size-4" />
					{t("dashboard:settings.sessions")}
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-3">
				{loading ? (
					<div className="space-y-2">
						<Skeleton className="h-4 w-full" />
						<Skeleton className="h-4 w-full" />
						<Skeleton className="h-4 w-2/3" />
					</div>
				) : sessions.length === 0 ? (
					<p className="text-sm text-text-tertiary">
						{t("dashboard:settings.noActiveSessions")}
					</p>
				) : (
					<div className="space-y-2">
						{sessions.map((s) => (
							<div
								key={s.id}
								className="flex items-center justify-between py-1"
							>
								<div className="flex-1 min-w-0">
									<p className="text-sm truncate">
										{formatUserAgent(s.userAgent)}
									</p>
									<p className="text-xs text-text-tertiary">
										{s.ipAddress ?? t("dashboard:settings.unknownIP")} &middot;{" "}
										{s.createdAt
											? new Date(s.createdAt).toLocaleDateString(undefined, {
													month: "short",
													day: "numeric",
													hour: "2-digit",
													minute: "2-digit",
												})
											: t("dashboard:settings.unknownDate")}
									</p>
								</div>
								<Badge variant="outline" className="text-[10px] ml-2 shrink-0">
									{t("dashboard:settings.currentBadge")}
								</Badge>
							</div>
						))}
					</div>
				)}
				<Button
					variant="outline"
					size="sm"
					onClick={handleRevokeAll}
					disabled={revoking || loading || sessions.length === 0}
				>
					{revoking
						? t("dashboard:settings.signingOutSessions")
						: t("dashboard:settings.signOutAllSessions")}
				</Button>
			</CardContent>
		</Card>
	);
}
