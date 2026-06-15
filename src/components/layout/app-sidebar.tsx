"use client";

import { Link, useNavigate } from "@tanstack/react-router";
import {
	BarChart,
	ChevronsUpDown,
	FileText,
	FlaskConical,
	LayoutDashboard,
	Plus,
	Settings,
	ShieldAlert,
	ShieldCheck,
	Users,
} from "lucide-react";
import { useEffect, useState } from "react";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
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
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
	SidebarSeparator,
} from "#/components/ui/sidebar";
import { authClient, organization } from "#/lib/auth-client";

type Org = {
	id: string;
	name: string;
	slug: string;
	logo: string | null;
};

function AppSidebar() {
	const navigate = useNavigate();
	const { data: session } = authClient.useSession();
	const [orgs, setOrgs] = useState<Org[]>([]);

	const activeOrgId = session?.session?.activeOrganizationId;

	useEffect(() => {
		organization.list().then(({ data }) => {
			if (data) setOrgs(data as Org[]);
		});
	}, []);

	const activeOrg = orgs.find((o) => o.id === activeOrgId);

	const handleSwitchOrg = async (orgId: string) => {
		await organization.setActive({ organizationId: orgId });
		navigate({ to: "/dashboard" });
	};

	return (
		<Sidebar collapsible="icon">
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<SidebarMenuButton
									size="lg"
									className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
								>
									<div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-accent-blue text-white">
										<ShieldCheck className="size-4" />
									</div>
									<div className="grid flex-1 text-left text-sm leading-tight">
										<span className="truncate font-semibold">
											{activeOrg?.name ?? "Workspace"}
										</span>
										<span className="truncate text-xs text-text-tertiary">
											{activeOrg?.slug ?? ""}
										</span>
									</div>
									<ChevronsUpDown className="ml-auto size-4" />
								</SidebarMenuButton>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								align="start"
								className="w-(--sidebar-width) rounded-lg"
							>
								<DropdownMenuLabel className="text-xs text-text-tertiary">
									Workspaces
								</DropdownMenuLabel>
								{orgs.map((org) => (
									<DropdownMenuItem
										key={org.id}
										onClick={() => handleSwitchOrg(org.id)}
										className="gap-2 p-2"
									>
										<div className="flex size-6 items-center justify-center rounded-md border bg-background">
											<ShieldCheck className="size-3" />
										</div>
										{org.name}
									</DropdownMenuItem>
								))}
								<DropdownMenuSeparator />
								<DropdownMenuItem
									onClick={() => navigate({ to: "/onboarding" })}
									className="gap-2 p-2"
								>
									<div className="flex size-6 items-center justify-center rounded-md border bg-background">
										<Plus className="size-3" />
									</div>
									Create workspace
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
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
								<SidebarMenuSub>
									<SidebarMenuSubItem>
										<SidebarMenuSubButton asChild isActive={false}>
											<Link to="/dashboard/validation/workspace">
												<span>Testing Workspace</span>
											</Link>
										</SidebarMenuSubButton>
									</SidebarMenuSubItem>
								</SidebarMenuSub>
							</SidebarMenuItem>
							<SidebarMenuItem>
								<SidebarMenuButton asChild isActive={false} tooltip="Mocks">
									<Link to="/dashboard/mocks">
										<FlaskConical />
										<span>Mocks</span>
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
							<SidebarMenuItem>
								<SidebarMenuButton
									asChild
									isActive={false}
									tooltip="Drift Detection"
								>
									<Link to="/dashboard/drift">
										<ShieldAlert />
										<span>Drift Detection</span>
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
								<SidebarMenuButton asChild isActive={false} tooltip="Team">
									<Link to="/dashboard/team/members">
										<Users />
										<span>Team</span>
									</Link>
								</SidebarMenuButton>
								<SidebarMenuSub>
									<SidebarMenuSubItem>
										<SidebarMenuSubButton asChild isActive={false}>
											<Link to="/dashboard/team/members">
												<span>Members</span>
											</Link>
										</SidebarMenuSubButton>
									</SidebarMenuSubItem>
									<SidebarMenuSubItem>
										<SidebarMenuSubButton asChild isActive={false}>
											<Link to="/dashboard/team/audit-log">
												<span>Audit Log</span>
											</Link>
										</SidebarMenuSubButton>
									</SidebarMenuSubItem>
								</SidebarMenuSub>
							</SidebarMenuItem>
							<SidebarMenuItem>
								<SidebarMenuButton asChild isActive={false} tooltip="Settings">
									<Link to="/dashboard/settings/account">
										<Settings />
										<span>Settings</span>
									</Link>
								</SidebarMenuButton>
								<SidebarMenuSub>
									<SidebarMenuSubItem>
										<SidebarMenuSubButton asChild isActive={false}>
											<Link to="/dashboard/settings/account">
												<span>Account</span>
											</Link>
										</SidebarMenuSubButton>
									</SidebarMenuSubItem>
									<SidebarMenuSubItem>
										<SidebarMenuSubButton asChild isActive={false}>
											<Link to="/dashboard/settings/workspace">
												<span>Workspace</span>
											</Link>
										</SidebarMenuSubButton>
									</SidebarMenuSubItem>
									<SidebarMenuSubItem>
										<SidebarMenuSubButton asChild isActive={false}>
											<Link to="/dashboard/settings/api-keys">
												<span>API Keys</span>
											</Link>
										</SidebarMenuSubButton>
									</SidebarMenuSubItem>
								</SidebarMenuSub>
							</SidebarMenuItem>
							<SidebarMenuItem>
								<SidebarMenuButton asChild isActive={false} tooltip="Reports">
									<Link to="/dashboard/reports">
										<BarChart />
										<span>Reports</span>
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
