import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppSidebar, AppTopbar } from "#/components/layout";
import { CommandPalette } from "#/components/shared/CommandPalette";
import { SidebarInset, SidebarProvider } from "#/components/ui/sidebar";
import { getSession } from "#/lib/auth.functions";

export const Route = createFileRoute("/dashboard")({
	beforeLoad: async ({ location }) => {
		const session = await getSession();

		if (!session?.user) {
			throw redirect({
				to: "/login",
				search: { redirect: location.href },
			});
		}

		if (!session.session.activeOrganizationId) {
			throw redirect({ to: "/onboarding" });
		}

		return { user: session.user };
	},
	component: DashboardLayout,
});

function DashboardLayout() {
	const { user } = Route.useRouteContext();
	return (
		<SidebarProvider defaultOpen>
			<AppSidebar user={user} />
			<SidebarInset>
				<AppTopbar />
				<div className="flex flex-1 flex-col p-6">
					<Outlet />
				</div>
			</SidebarInset>
			<CommandPalette />
		</SidebarProvider>
	);
}
