"use client";

import { Link, useNavigate } from "@tanstack/react-router";
import {
	BarChart,
	ChevronsUpDown,
	FileText,
	FlaskConical,
	LayoutDashboard,
	Settings,
	ShieldAlert,
	ShieldCheck,
	Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
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

interface AppSidebarProps {
	user?: {
		id: string;
		name: string;
		email: string;
		image?: string | null;
	} | null;
}

function AppSidebar({ user: propUser }: AppSidebarProps) {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { data: session } = authClient.useSession();
	const [orgs, setOrgs] = useState<Org[]>([]);
	const [mounted, setMounted] = useState(false);

	useEffect(() => setMounted(true), []);

	const activeOrgId = session?.session?.activeOrganizationId;

	useEffect(() => {
		organization.list().then(({ data }) => {
			if (data) setOrgs(data as Org[]);
		});
	}, []);

	const activeOrg = orgs.find((o) => o.id === activeOrgId);

	const displayUser = mounted && session?.user ? session.user : propUser;

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
									{t("dashboard:sidebar.workspaces")}
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
							</DropdownMenuContent>
						</DropdownMenu>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>

			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>
						{t("dashboard:sidebar.navigation")}
					</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							<SidebarMenuItem>
								<SidebarMenuButton
									asChild
									isActive={false}
									tooltip={t("dashboard:sidebar.dashboard")}
								>
									<Link to="/dashboard">
										<LayoutDashboard />
										<span>{t("dashboard:sidebar.dashboard")}</span>
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
							<SidebarMenuItem>
								<SidebarMenuButton
									asChild
									isActive={false}
									tooltip={t("dashboard:sidebar.specs")}
								>
									<Link to="/dashboard/specs">
										<FileText />
										<span>{t("dashboard:sidebar.specs")}</span>
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
							<SidebarMenuItem>
								<SidebarMenuButton
									asChild
									isActive={false}
									tooltip={t("dashboard:sidebar.validation")}
								>
									<Link to="/dashboard/validation">
										<ShieldCheck />
										<span>{t("dashboard:sidebar.validation")}</span>
									</Link>
								</SidebarMenuButton>
								<SidebarMenuSub>
									<SidebarMenuSubItem>
										<SidebarMenuSubButton asChild isActive={false}>
											<Link to="/dashboard/validation/workspace">
												<span>{t("dashboard:sidebar.testingWorkspace")}</span>
											</Link>
										</SidebarMenuSubButton>
									</SidebarMenuSubItem>
								</SidebarMenuSub>
							</SidebarMenuItem>
							<SidebarMenuItem>
								<SidebarMenuButton
									asChild
									isActive={false}
									tooltip={t("dashboard:sidebar.mocks")}
								>
									<Link to="/dashboard/mocks">
										<FlaskConical />
										<span>{t("dashboard:sidebar.mocks")}</span>
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
							<SidebarMenuItem>
								<SidebarMenuButton
									asChild
									isActive={false}
									tooltip={t("dashboard:sidebar.drift")}
								>
									<Link to="/dashboard/drift">
										<ShieldAlert />
										<span>{t("dashboard:sidebar.drift")}</span>
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>

				<SidebarSeparator />

				<SidebarGroup>
					<SidebarGroupLabel>{t("dashboard:sidebar.manage")}</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							<SidebarMenuItem>
								<SidebarMenuButton
									asChild
									isActive={false}
									tooltip={t("dashboard:sidebar.team")}
								>
									<Link to="/dashboard/team/members">
										<Users />
										<span>{t("dashboard:sidebar.team")}</span>
									</Link>
								</SidebarMenuButton>
								<SidebarMenuSub>
									<SidebarMenuSubItem>
										<SidebarMenuSubButton asChild isActive={false}>
											<Link to="/dashboard/team/members">
												<span>{t("dashboard:sidebar.teamMembers")}</span>
											</Link>
										</SidebarMenuSubButton>
									</SidebarMenuSubItem>
									<SidebarMenuSubItem>
										<SidebarMenuSubButton asChild isActive={false}>
											<Link to="/dashboard/team/audit-log">
												<span>{t("dashboard:sidebar.auditLog")}</span>
											</Link>
										</SidebarMenuSubButton>
									</SidebarMenuSubItem>
									<SidebarMenuSubItem>
										<SidebarMenuSubButton asChild isActive={false}>
											<Link to="/dashboard/team/invitations">
												<span>{t("dashboard:sidebar.teamInvitations")}</span>
											</Link>
										</SidebarMenuSubButton>
									</SidebarMenuSubItem>
								</SidebarMenuSub>
							</SidebarMenuItem>
							<SidebarMenuItem>
								<SidebarMenuButton
									asChild
									isActive={false}
									tooltip={t("dashboard:sidebar.settings")}
								>
									<Link to="/dashboard/settings/account">
										<Settings />
										<span>{t("dashboard:sidebar.settings")}</span>
									</Link>
								</SidebarMenuButton>
								<SidebarMenuSub>
									<SidebarMenuSubItem>
										<SidebarMenuSubButton asChild isActive={false}>
											<Link to="/dashboard/settings/account">
												<span>{t("dashboard:sidebar.account")}</span>
											</Link>
										</SidebarMenuSubButton>
									</SidebarMenuSubItem>
									<SidebarMenuSubItem>
										<SidebarMenuSubButton asChild isActive={false}>
											<Link to="/dashboard/settings/workspace">
												<span>{t("dashboard:sidebar.workspace")}</span>
											</Link>
										</SidebarMenuSubButton>
									</SidebarMenuSubItem>
									<SidebarMenuSubItem>
										<SidebarMenuSubButton asChild isActive={false}>
											<Link to="/dashboard/settings/api-keys">
												<span>{t("dashboard:sidebar.apiKeys")}</span>
											</Link>
										</SidebarMenuSubButton>
									</SidebarMenuSubItem>
								</SidebarMenuSub>
							</SidebarMenuItem>
							<SidebarMenuItem>
								<SidebarMenuButton
									asChild
									isActive={false}
									tooltip={t("dashboard:sidebar.reports")}
								>
									<Link to="/dashboard/reports">
										<BarChart />
										<span>{t("dashboard:sidebar.reports")}</span>
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>

			<SidebarFooter>
				{displayUser && (
					<div className="p-2">
						<div className="flex items-center gap-2 rounded-md p-2">
							<div className="flex size-8 items-center justify-center rounded-full bg-accent-blue text-white text-xs font-medium">
								{displayUser.name?.charAt(0).toUpperCase() ?? "U"}
							</div>
							<div className="grid flex-1 text-left text-sm leading-tight">
								<span className="truncate font-medium">{displayUser.name}</span>
								<span className="truncate text-xs text-text-tertiary">
									{displayUser.email}
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
