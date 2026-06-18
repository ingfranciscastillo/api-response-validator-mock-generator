import { createFileRoute } from "@tanstack/react-router";
import { Bell, BellOff, BellPlus, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "#/components/ui/dialog";
import { EmptyState } from "#/components/ui/empty-state";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import { Skeleton } from "#/components/ui/skeleton";
import { Switch } from "#/components/ui/switch";
import {
	deleteNotificationChannel,
	getNotificationChannels,
	saveNotificationChannel,
} from "#/lib/notifications/functions";

export const Route = createFileRoute("/dashboard/drift/notifications")({
	head: () => ({
		meta: [
			{
				title: "Drift Notifications — API Response Validator & Mock Generator",
			},
		],
	}),
	component: NotificationsPage,
});

function NotificationsPage() {
	const { t } = useTranslation();
	const [channels, setChannels] = useState<
		Awaited<ReturnType<typeof getNotificationChannels>>
	>([]);
	const [loading, setLoading] = useState(true);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [formName, setFormName] = useState("");
	const [formType, setFormType] = useState("webhook");
	const [formUrl, setFormUrl] = useState("");
	const [formEmail, setFormEmail] = useState("");
	const [saving, setSaving] = useState(false);

	const fetchChannels = () => {
		setLoading(true);
		getNotificationChannels()
			.then(setChannels)
			.finally(() => setLoading(false));
	};

	useEffect(() => {
		fetchChannels();
	}, []);

	const resetForm = () => {
		setFormName("");
		setFormType("webhook");
		setFormUrl("");
		setFormEmail("");
	};

	const handleSave = async () => {
		if (!formName) return;
		setSaving(true);
		try {
			const config =
				formType === "webhook" ? { url: formUrl } : { email: formEmail };
			await saveNotificationChannel({
				data: {
					name: formName,
					type: formType,
					config: config as Record<string, unknown>,
				},
			});
			resetForm();
			setDialogOpen(false);
			fetchChannels();
		} finally {
			setSaving(false);
		}
	};

	const handleToggle = async (
		channel: (typeof channels)[number],
		enabled: boolean,
	) => {
		await saveNotificationChannel({
			data: {
				id: channel.id,
				name: channel.name,
				type: channel.type,
				config: channel.config as Record<string, unknown>,
				enabled,
			},
		});
		fetchChannels();
	};

	const handleDelete = async (channelId: string) => {
		await deleteNotificationChannel({ data: { channelId } });
		fetchChannels();
	};

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center justify-between">
				<p className="text-sm text-muted-foreground">
					{t("dashboard:drift.channelCount", { count: channels.length })}
				</p>
				<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
					<DialogTrigger asChild>
						<Button size="sm">
							<Plus className="size-4 mr-1" />
							{t("dashboard:drift.addChannel")}
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>{t("dashboard:drift.newChannel")}</DialogTitle>
							<DialogDescription>
								{t("dashboard:drift.newChannelDescription")}
							</DialogDescription>
						</DialogHeader>
						<div className="space-y-4 py-2">
							<div className="space-y-1">
								<Label>{t("dashboard:drift.channelName")}</Label>
								<Input
									placeholder={t("dashboard:drift.channelNamePlaceholder")}
									value={formName}
									onChange={(e) => setFormName(e.target.value)}
								/>
							</div>
							<div className="space-y-1">
								<Label>{t("dashboard:drift.channelType")}</Label>
								<Select value={formType} onValueChange={setFormType}>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="webhook">
											{t("dashboard:drift.typeWebhook")}
										</SelectItem>
										<SelectItem value="email">
											{t("dashboard:drift.typeEmail")}
										</SelectItem>
									</SelectContent>
								</Select>
							</div>
							{formType === "webhook" ? (
								<div className="space-y-1">
									<Label>{t("dashboard:drift.webhookUrl")}</Label>
									<Input
										placeholder={t("dashboard:drift.webhookUrlPlaceholder")}
										value={formUrl}
										onChange={(e) => setFormUrl(e.target.value)}
									/>
								</div>
							) : (
								<div className="space-y-1">
									<Label>{t("dashboard:drift.typeEmail")}</Label>
									<Input
										type="email"
										placeholder={t("dashboard:drift.emailPlaceholder")}
									/>
								</div>
							)}
						</div>
						<DialogFooter>
							<Button
								variant="outline"
								onClick={() => {
									resetForm();
									setDialogOpen(false);
								}}
							>
								{t("common:cancel")}
							</Button>
							<Button onClick={handleSave} disabled={!formName || saving}>
								{saving ? t("common:saving") : t("common:save")}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>

			{loading ? (
				<div className="space-y-2">
					{Array.from({ length: 2 }).map((_, i) => (
						<Card key={i}>
							<CardContent className="flex items-center gap-3 py-3">
								<Skeleton className="size-5 rounded-full" />
								<div className="flex-1 space-y-1.5">
									<Skeleton className="h-4 w-32" />
									<Skeleton className="h-3 w-48" />
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			) : channels.length === 0 ? (
				<EmptyState
					icon={<BellPlus className="size-8" />}
					title={t("dashboard:drift.noChannels")}
					description={t("dashboard:drift.noChannelsDescription")}
				/>
			) : (
				<div className="space-y-2">
					{channels.map((channel) => (
						<Card key={channel.id}>
							<CardContent className="flex items-center justify-between py-3">
								<div className="flex items-center gap-3">
									{channel.enabled ? (
										<Bell className="size-5 text-primary" />
									) : (
										<BellOff className="size-5 text-muted-foreground" />
									)}
									<div>
										<p className="text-sm font-medium">{channel.name}</p>
										<div className="flex items-center gap-2 mt-0.5">
											<Badge variant="outline" className="text-xs">
												{channel.type}
											</Badge>
											{channel.type === "webhook" &&
												(channel.config as { url?: string })?.url && (
													<code className="text-xs text-muted-foreground font-mono truncate max-w-52">
														{(channel.config as { url: string }).url}
													</code>
												)}
											{channel.type === "email" &&
												(channel.config as { email?: string })?.email && (
													<span className="text-xs text-muted-foreground">
														{(channel.config as { email: string }).email}
													</span>
												)}
										</div>
									</div>
								</div>
								<div className="flex items-center gap-2">
									<Switch
										checked={channel.enabled}
										onCheckedChange={(checked) =>
											handleToggle(channel, checked)
										}
									/>
									<Button
										variant="ghost"
										size="icon-xs"
										onClick={() => handleDelete(channel.id)}
									>
										<Trash2 className="size-4 text-red-500" />
									</Button>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}
