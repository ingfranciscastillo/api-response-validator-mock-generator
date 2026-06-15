import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/reports")({
	component: ReportsLayout,
});

function ReportsLayout() {
	return <Outlet />;
}
