import {
	createFileRoute,
	Link,
	Outlet,
	useLocation,
} from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/team")({
	component: TeamLayout,
});

function TeamLayout() {
	const location = useLocation();
	const currentTab = location.pathname.endsWith("/audit-log")
		? "audit-log"
		: "members";

	return (
		<div className="flex flex-col gap-4">
			<div>
				<h2 className="text-2xl font-bold">Team</h2>
				<p className="text-text-secondary mt-1">
					Manage your team members and permissions
				</p>
			</div>
			<div className="flex gap-4 border-b border-border">
				<Link
					to="/dashboard/team/members"
					className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
						currentTab === "members"
							? "border-primary text-foreground"
							: "border-transparent text-text-tertiary hover:text-foreground"
					}`}
				>
					Members
				</Link>
				<Link
					to="/dashboard/team/audit-log"
					className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
						currentTab === "audit-log"
							? "border-primary text-foreground"
							: "border-transparent text-text-tertiary hover:text-foreground"
					}`}
				>
					Audit Log
				</Link>
			</div>
			<Outlet />
		</div>
	);
}
