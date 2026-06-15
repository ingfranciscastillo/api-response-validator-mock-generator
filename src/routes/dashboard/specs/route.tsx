import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/specs")({
	component: SpecsLayout,
});

function SpecsLayout() {
	return <Outlet />;
}
