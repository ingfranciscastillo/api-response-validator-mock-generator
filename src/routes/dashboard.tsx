import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppSidebar, AppTopbar } from "#/components/layout";
import { CommandPalette } from "#/components/shared/CommandPalette";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "#/components/ui/sidebar";
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

		return { user: session.user };
	},
	component: DashboardLayout,
});

function DashboardLayout() {
	return (
		<SidebarProvider defaultOpen>
			<AppSidebar />
			<SidebarInset>
				<header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-4">
					<SidebarTrigger />
				</header>
				<AppTopbar />
				<div className="flex flex-1 flex-col p-6">
					<Outlet />
				</div>
			</SidebarInset>
			<CommandPalette />
		</SidebarProvider>
	);
}
