import {
	createFileRoute,
	Link,
	Outlet,
	useLocation,
} from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/dashboard/team")({
	component: TeamLayout,
});

function TeamLayout() {
	const { t } = useTranslation();
	const location = useLocation();
	const currentTab = location.pathname.endsWith("/audit-log")
		? "audit-log"
		: location.pathname.endsWith("/invitations")
			? "invitations"
			: "members";

	return (
		<div className="flex flex-col gap-4">
			<div>
				<h2 className="text-2xl font-bold">{t("dashboard:team.title")}</h2>
				<p className="text-text-secondary mt-1">
					{t("dashboard:team.description")}
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
					{t("dashboard:team.members")}
				</Link>
				<Link
					to="/dashboard/team/audit-log"
					className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
						currentTab === "audit-log"
							? "border-primary text-foreground"
							: "border-transparent text-text-tertiary hover:text-foreground"
					}`}
				>
					{t("dashboard:team.auditLog")}
				</Link>
				<Link
					to="/dashboard/team/invitations"
					className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
						currentTab === "invitations"
							? "border-primary text-foreground"
							: "border-transparent text-text-tertiary hover:text-foreground"
					}`}
				>
					{t("dashboard:team.invitations")}
				</Link>
			</div>
			<Outlet />
		</div>
	);
}
