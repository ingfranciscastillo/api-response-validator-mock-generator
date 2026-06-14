"use client";

import { Link } from "@tanstack/react-router";
import {
	FileText,
	FlaskConical,
	LayoutDashboard,
	Settings,
	ShieldCheck,
} from "lucide-react";

import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarSeparator,
} from "#/components/ui/sidebar";
import { authClient } from "#/lib/auth-client";

function AppSidebar() {
	const { data: session } = authClient.useSession();

	return (
		<Sidebar collapsible="icon">
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							asChild
							size="lg"
							className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
						>
							<Link to="/dashboard">
								<div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-accent-blue text-white">
									<ShieldCheck className="size-4" />
								</div>
								<div className="grid flex-1 text-left text-sm leading-tight">
									<span className="truncate font-semibold">API Validator</span>
									<span className="truncate text-xs text-text-tertiary">
										Mock Generator
									</span>
								</div>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>

			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Navigation</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							<SidebarMenuItem>
								<SidebarMenuButton asChild isActive={false} tooltip="Dashboard">
									<Link to="/dashboard">
										<LayoutDashboard />
										<span>Dashboard</span>
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
							<SidebarMenuItem>
								<SidebarMenuButton
									asChild
									isActive={false}
									tooltip="Specifications"
								>
									<Link to="/dashboard/specs">
										<FileText />
										<span>Specifications</span>
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
							<SidebarMenuItem>
								<SidebarMenuButton
									asChild
									isActive={false}
									tooltip="Validation"
								>
									<Link to="/dashboard/validation">
										<ShieldCheck />
										<span>Validation</span>
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
							<SidebarMenuItem>
								<SidebarMenuButton asChild isActive={false} tooltip="Mocks">
									<Link to="/dashboard/mocks">
										<FlaskConical />
										<span>Mocks</span>
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>

				<SidebarSeparator />

				<SidebarGroup>
					<SidebarGroupLabel>Manage</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							<SidebarMenuItem>
								<SidebarMenuButton asChild isActive={false} tooltip="Settings">
									<Link to="/dashboard/settings">
										<Settings />
										<span>Settings</span>
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>

			<SidebarFooter>
				{session?.user && (
					<div className="p-2">
						<div className="flex items-center gap-2 rounded-md p-2">
							<div className="flex size-8 items-center justify-center rounded-full bg-accent-blue text-white text-xs font-medium">
								{session.user.name?.charAt(0).toUpperCase() ?? "U"}
							</div>
							<div className="grid flex-1 text-left text-sm leading-tight">
								<span className="truncate font-medium">
									{session.user.name}
								</span>
								<span className="truncate text-xs text-text-tertiary">
									{session.user.email}
								</span>
							</div>
						</div>
					</div>
				)}
			</SidebarFooter>
		</Sidebar>
	);
}

export { AppSidebar };
