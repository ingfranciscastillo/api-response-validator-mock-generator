import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppSidebar, AppTopbar } from "#/components/layout";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "#/components/ui/sidebar";

export const Route = createFileRoute("/dashboard")({
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
		</SidebarProvider>
	);
}
