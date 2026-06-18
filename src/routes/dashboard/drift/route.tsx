import {
	createFileRoute,
	Link,
	Outlet,
	useLocation,
} from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/dashboard/drift")({
	component: DriftLayout,
});

function DriftLayout() {
	const { t } = useTranslation();
	const tabs = [
		{
			id: "alerts",
			label: t("dashboard:drift.alerts"),
			path: "/dashboard/drift",
		},
		{
			id: "notifications",
			label: t("dashboard:drift.notifications"),
			path: "/dashboard/drift/notifications",
		},
		{
			id: "monitored-specs",
			label: t("dashboard:drift.monitoredSpecs"),
			path: "/dashboard/drift/monitored-specs",
		},
	];
	const location = useLocation();
	const currentTab =
		tabs.find((t) => location.pathname.endsWith(t.path))?.id ?? "alerts";

	return (
		<div className="flex flex-col gap-4">
			<div>
				<h2 className="text-2xl font-bold">{t("dashboard:drift.title")}</h2>
				<p className="text-muted-foreground mt-1">
					{t("dashboard:drift.description")}
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
