import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/settings")({
	component: SettingsPage,
});

function SettingsPage() {
	return (
		<div className="flex flex-col gap-4">
			<div>
				<h2 className="text-2xl font-bold">Settings</h2>
				<p className="text-text-secondary mt-1">
					Manage your account and workspace settings
				</p>
			</div>
			<div className="rounded-lg border border-border bg-surface p-8">
				<p className="text-text-tertiary">Settings coming soon</p>
			</div>
		</div>
	);
}
