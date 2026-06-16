"use client";

import { useLocation, useNavigate } from "@tanstack/react-router";
import { Bell, ChevronRight, LogOut, User } from "lucide-react";
import { useEffect, useState } from "react";
import { ModeToggle } from "#/components/mode-toggle";
import { Button } from "#/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { SidebarTrigger } from "#/components/ui/sidebar";
import { authClient } from "#/lib/auth-client";
import { getDriftAlerts } from "#/lib/drift/functions";

interface BreadcrumbItem {
	label: string;
	href?: string;
}

const routeLabels: Record<string, string> = {
	"/dashboard": "Dashboard",
	"/dashboard/specs": "Specifications",
	"/dashboard/validation": "Validation",
	"/dashboard/mocks": "Mocks",
	"/dashboard/settings": "Settings",
	"/dashboard/team": "Team",
	"/dashboard/reports": "Reports",
};

function getBreadcrumbs(pathname: string): BreadcrumbItem[] {
	const segments = pathname.split("/").filter(Boolean);
	const breadcrumbs: BreadcrumbItem[] = [];

	let currentPath = "";
	for (const segment of segments) {
		currentPath += `/${segment}`;
		const label = routeLabels[currentPath] ?? segment;
		breadcrumbs.push({ label, href: currentPath });
	}

	return breadcrumbs;
}

function AppTopbar() {
	const location = useLocation();
	const navigate = useNavigate();
	const { data: session, isPending } = authClient.useSession();
	const signOut = authClient.signOut;
	const [alertCount, setAlertCount] = useState(0);

	const breadcrumbs = getBreadcrumbs(location.pathname);

	useEffect(() => {
		getDriftAlerts({ data: { status: "open" } })
			.then((alerts) => setAlertCount(alerts.length))
			.catch(() => {});
	}, []);

	const handleSignOut = async () => {
		await signOut();
		window.location.href = "/";
	};

	return (
		<header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-4">
			<SidebarTrigger />
			<nav className="flex items-center gap-1 text-sm">
				{breadcrumbs.map((crumb, index) => (
					<div key={crumb.href} className="flex items-center gap-1">
						{index > 0 && (
							<ChevronRight className="size-4 text-text-tertiary" />
						)}
						{crumb.href && index < breadcrumbs.length - 1 ? (
							<a
								href={crumb.href}
								className="text-text-secondary hover:text-text-primary transition-colors"
							>
								{crumb.label}
							</a>
						) : (
							<span className="font-medium text-text-primary">
								{crumb.label}
							</span>
						)}
					</div>
				))}
			</nav>

			<div className="ml-auto flex items-center gap-2">
				<ModeToggle />
				<Button
					variant="ghost"
					size="icon"
					className="relative"
					onClick={() => navigate({ to: "/dashboard/drift" })}
				>
					<Bell className="size-5" />
					{alertCount > 0 && (
						<span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
							{alertCount > 9 ? "9+" : alertCount}
						</span>
					)}
				</Button>

				{isPending ? (
					<div className="h-8 w-8 rounded-full bg-surface-elevated animate-pulse" />
				) : session?.user ? (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" size="sm" className="gap-2">
								<div className="flex size-8 items-center justify-center rounded-full bg-accent-blue text-white text-xs font-medium">
									{session.user.name?.charAt(0).toUpperCase() ?? "U"}
								</div>
								<span className="hidden md:inline">{session.user.name}</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-56">
							<DropdownMenuLabel>
								<div className="flex flex-col">
									<span>{session.user.name}</span>
									<span className="text-xs font-normal text-text-tertiary">
										{session.user.email}
									</span>
								</div>
							</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<DropdownMenuItem asChild>
								<a
									href="/dashboard/settings/account"
									className="flex items-center gap-2"
								>
									<User className="size-4" />
									<span>Account Settings</span>
								</a>
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								onClick={handleSignOut}
								className="text-error cursor-pointer"
								data-allow-propagation
							>
								<LogOut className="size-4" />
								<span>Sign Out</span>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				) : (
					<Button variant="ghost" size="sm" asChild>
						<a href="/login">Sign In</a>
					</Button>
				)}
			</div>
		</header>
	);
}

export { AppTopbar };
