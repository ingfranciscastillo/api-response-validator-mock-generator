import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/team")({
	component: TeamPage,
});

function TeamPage() {
	return (
		<div className="flex flex-col gap-4">
			<div>
				<h2 className="text-2xl font-bold">Team</h2>
				<p className="text-text-secondary mt-1">
					Manage your team members and permissions
				</p>
			</div>
			<div className="rounded-lg border border-border bg-surface p-8 text-center">
				<p className="text-text-tertiary">No team members yet</p>
				<p className="text-text-tertiary text-sm mt-1">
					Invite your first team member to get started
				</p>
			</div>
		</div>
	);
}
