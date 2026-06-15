import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/validation")({
	component: ValidationLayout,
});

function ValidationLayout() {
	return <Outlet />;
}
