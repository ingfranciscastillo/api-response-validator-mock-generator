import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/drift")({
	component: DriftLayout,
});

function DriftLayout() {
	return <Outlet />;
}
