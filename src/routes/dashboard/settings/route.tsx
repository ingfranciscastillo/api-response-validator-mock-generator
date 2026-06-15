import {
	createFileRoute,
	Link,
	Outlet,
	useLocation,
} from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/settings")({
	component: SettingsLayout,
});

const tabs = [
	{ id: "account", label: "Account", path: "/dashboard/settings/account" },
	{
		id: "workspace",
		label: "Workspace",
		path: "/dashboard/settings/workspace",
	},
	{ id: "api-keys", label: "API Keys", path: "/dashboard/settings/api-keys" },
];

function SettingsLayout() {
	const location = useLocation();
	const currentTab =
		tabs.find((t) => location.pathname.startsWith(t.path))?.id ?? "account";

	return (
		<div className="flex flex-col gap-4">
			<div>
				<h2 className="text-2xl font-bold">Settings</h2>
				<p className="text-text-secondary mt-1">
					Manage your account and workspace settings
				</p>
			</div>
			<div className="flex gap-4 border-b border-border">
				{tabs.map((tab) => (
					<Link
						key={tab.id}
						to={tab.path}
						className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
							currentTab === tab.id
								? "border-primary text-foreground"
								: "border-transparent text-text-tertiary hover:text-foreground"
						}`}
					>
						{tab.label}
					</Link>
				))}
			</div>
			<Outlet />
		</div>
	);
}
