import {
	createFileRoute,
	Link,
	Outlet,
	useLocation,
} from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/dashboard/settings")({
	component: SettingsLayout,
});

const tabs = [
	{
		id: "account",
		key: "dashboard:settings.account",
		path: "/dashboard/settings/account",
	},
	{
		id: "security",
		key: "dashboard:settings.security",
		path: "/dashboard/settings/security",
	},
	{
		id: "workspace",
		key: "dashboard:settings.workspace",
		path: "/dashboard/settings/workspace",
	},
	{
		id: "api-keys",
		key: "dashboard:settings.apiKeys",
		path: "/dashboard/settings/api-keys",
	},
];

function SettingsLayout() {
	const { t } = useTranslation();
	const location = useLocation();
	const currentTab =
		tabs.find((t) => location.pathname.startsWith(t.path))?.id ?? "account";

	return (
		<div className="flex flex-col gap-4">
			<div>
				<h2 className="text-2xl font-bold">{t("dashboard:settings.title")}</h2>
				<p className="text-text-secondary mt-1">
					{t("dashboard:settings.settingsDescription")}
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
						{t(tab.key)}
					</Link>
				))}
			</div>
			<Outlet />
		</div>
	);
}
