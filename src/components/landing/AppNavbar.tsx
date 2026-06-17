"use client";

import { SiBuymeacoffee, SiGithub, SiX } from "@icons-pack/react-simple-icons";
import { Menu } from "lucide-react";
import { useState } from "react";

import { ModeToggle } from "#/components/mode-toggle";
import { Button } from "#/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetTitle,
	SheetTrigger,
} from "#/components/ui/sheet";

const navLinks = [
	{ label: "Features", href: "#features" },
	{ label: "Docs", href: "#" },
	{ label: "Pricing", href: "#" },
];

export function AppNavbar() {
	const [open, setOpen] = useState(false);

	return (
		<header className="fixed top-0 z-50 w-full backdrop-blur-md">
			<div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
				<a href="/" className="flex items-center gap-2">
					<div className="flex size-8 items-center justify-center rounded-lg bg-accent-blue text-sm font-bold text-white">
						AV
					</div>
					<span className="font-semibold text-text-primary">API Validator</span>
				</a>

				<nav className="hidden md:flex md:items-center md:gap-1">
					{navLinks.map((link) => (
						<Button key={link.label} variant="ghost" asChild>
							<a href={link.href}>{link.label}</a>
						</Button>
					))}
				</nav>

				<div className="flex items-center gap-1 sm:gap-2">
					<a
						href="#"
						className="hidden text-text-tertiary transition-colors hover:text-text-primary sm:block"
						aria-label="GitHub"
					>
						<SiGithub className="size-4" />
					</a>
					<a
						href="#"
						className="hidden text-text-tertiary transition-colors hover:text-text-primary sm:block"
						aria-label="X (Twitter)"
					>
						<SiX className="size-4" />
					</a>
					<a
						href="#"
						className="hidden text-text-tertiary transition-colors hover:text-text-primary sm:block"
						aria-label="Buy Me a Coffee"
					>
						<SiBuymeacoffee className="size-4" />
					</a>

					<div className="hidden sm:block">
						<ModeToggle />
					</div>

					<Button
						variant="outline"
						size="sm"
						asChild
						className="hidden sm:inline-flex"
					>
						<a href="/login">Sign In</a>
					</Button>

					<Sheet open={open} onOpenChange={setOpen}>
						<SheetTrigger asChild>
							<Button variant="ghost" size="icon" className="md:hidden">
								{open ? <X className="size-5" /> : <Menu className="size-5" />}
								<span className="sr-only">Toggle menu</span>
							</Button>
						</SheetTrigger>
						<SheetContent side="right">
							<SheetTitle className="sr-only">Navigation Menu</SheetTitle>
							<nav className="mt-8 flex flex-col gap-2">
								{navLinks.map((link) => (
									<Button
										key={link.label}
										variant="ghost"
										className="justify-start"
										asChild
										onClick={() => setOpen(false)}
									>
										<a href={link.href}>{link.label}</a>
									</Button>
								))}
								<div className="mt-4 flex items-center gap-3 border-t border-border pt-4">
									<a href="#" aria-label="GitHub">
										<SiGithub className="size-5 text-text-tertiary transition-colors hover:text-text-primary" />
									</a>
									<a href="#" aria-label="X (Twitter)">
										<SiX className="size-5 text-text-tertiary transition-colors hover:text-text-primary" />
									</a>
									<a href="#" aria-label="Buy Me a Coffee">
										<SiBuymeacoffee className="size-5 text-text-tertiary transition-colors hover:text-text-primary" />
									</a>
									<div className="ml-auto">
										<ModeToggle />
									</div>
								</div>
								<Button variant="outline" asChild className="mt-2">
									<a href="/login">Sign In</a>
								</Button>
							</nav>
						</SheetContent>
					</Sheet>
				</div>
			</div>
		</header>
	);
}
