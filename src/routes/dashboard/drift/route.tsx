import {
	createFileRoute,
	Link,
	Outlet,
	useLocation,
} from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/drift")({
	component: DriftLayout,
});

const tabs = [
	{ id: "alerts", label: "Alerts", path: "/dashboard/drift" },
	{
		id: "notifications",
		label: "Notifications",
		path: "/dashboard/drift/notifications",
	},
	{
		id: "monitored-specs",
		label: "Monitored Specs",
		path: "/dashboard/drift/monitored-specs",
	},
];

function DriftLayout() {
	const location = useLocation();
	const currentTab =
		tabs.find((t) => location.pathname.endsWith(t.path))?.id ?? "alerts";

	return (
		<div className="flex flex-col gap-4">
			<div>
				<h2 className="text-2xl font-bold">Drift Detection</h2>
				<p className="text-muted-foreground mt-1">
					Monitor API specifications for breaking changes and drift
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
