import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/mocks")({
	component: MocksLayout,
});

function MocksLayout() {
	return <Outlet />;
}
