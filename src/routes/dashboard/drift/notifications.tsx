import { createFileRoute } from "@tanstack/react-router";
import { Bell, BellOff, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
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
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import { Switch } from "#/components/ui/switch";
import {
	deleteNotificationChannel,
	getNotificationChannels,
	saveNotificationChannel,
} from "#/lib/notifications/functions";

export const Route = createFileRoute("/dashboard/drift/notifications")({
	component: NotificationsPage,
});

function NotificationsPage() {
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
		getNotificationChannels({ data: { organizationId: "" } })
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
					organizationId: "",
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
				organizationId: "",
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
					{channels.length} channel{channels.length !== 1 ? "s" : ""}
				</p>
				<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
					<DialogTrigger asChild>
						<Button size="sm">
							<Plus className="size-4 mr-1" />
							Add Channel
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>New Notification Channel</DialogTitle>
							<DialogDescription>
								Receive alerts when breaking changes are detected
							</DialogDescription>
						</DialogHeader>
						<div className="space-y-4 py-2">
							<div className="space-y-1">
								<Label>Name</Label>
								<Input
									placeholder="e.g. Slack Webhook"
									value={formName}
									onChange={(e) => setFormName(e.target.value)}
								/>
							</div>
							<div className="space-y-1">
								<Label>Type</Label>
								<Select value={formType} onValueChange={setFormType}>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="webhook">Webhook</SelectItem>
										<SelectItem value="email">Email</SelectItem>
									</SelectContent>
								</Select>
							</div>
							{formType === "webhook" ? (
								<div className="space-y-1">
									<Label>Webhook URL</Label>
									<Input
										placeholder="https://hooks.example.com/..."
										value={formUrl}
										onChange={(e) => setFormUrl(e.target.value)}
									/>
								</div>
							) : (
								<div className="space-y-1">
									<Label>Email</Label>
									<Input
										type="email"
										placeholder="team@example.com"
										value={formEmail}
										onChange={(e) => setFormEmail(e.target.value)}
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
								Cancel
							</Button>
							<Button onClick={handleSave} disabled={!formName || saving}>
								{saving ? "Saving..." : "Save"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>

			{loading ? (
				<div className="flex items-center justify-center py-12">
					<div className="size-8 animate-pulse rounded-full bg-muted" />
				</div>
			) : channels.length === 0 ? (
				<div className="rounded-lg border border-border bg-surface p-8 text-center">
					<Bell className="size-8 mx-auto text-muted-foreground" />
					<p className="text-muted-foreground mt-3">No notification channels</p>
					<p className="text-muted-foreground text-sm mt-1">
						Add a channel to receive alerts when breaking changes are detected
					</p>
				</div>
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
