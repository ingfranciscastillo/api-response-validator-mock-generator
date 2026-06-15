import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/specs/$specId")({
	component: SpecDetailLayout,
});

function SpecDetailLayout() {
	return <Outlet />;
}
