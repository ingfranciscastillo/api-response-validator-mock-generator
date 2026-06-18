"use client";

import { useGSAP } from "@gsap/react";
import { SiBuymeacoffee, SiGithub, SiX } from "@icons-pack/react-simple-icons";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Menu, X } from "lucide-react";
import { useRef, useState } from "react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

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
	const headerRef = useRef<HTMLElement>(null);

	useGSAP(
		() => {
			let lastScroll = 0;

			ScrollTrigger.create({
				start: "top top",
				onUpdate: () => {
					const st = window.scrollY;
					if (st > lastScroll && st > 100) {
						gsap.to(headerRef.current, {
							y: "-100%",
							duration: 0.3,
							ease: "power2.out",
						});
					} else if (st < lastScroll) {
						gsap.to(headerRef.current, {
							y: 0,
							duration: 0.3,
							ease: "power2.out",
						});
					}
					lastScroll = st;
				},
			});
		},
		{ scope: headerRef },
	);

	return (
		<header
			ref={headerRef}
			className="fixed top-0 z-50 w-full backdrop-blur-md"
		>
			<div className="mx-auto grid h-16 max-w-6xl grid-cols-3 items-center px-4">
				<div className="flex justify-start">
					<a href="/" className="flex items-center gap-2">
						<div className="flex size-8 items-center justify-center rounded-lg bg-accent-blue text-sm font-bold text-white">
							AV
						</div>
						<span className="font-semibold text-text-primary">
							API Validator
						</span>
					</a>
				</div>

				<nav className="hidden justify-center md:flex md:items-center md:gap-1">
					{navLinks.map((link) => (
						<Button key={link.label} variant="ghost" asChild>
							<a href={link.href}>{link.label}</a>
						</Button>
					))}
				</nav>

				<div className="flex justify-end items-center gap-2">
					<a
						href="https://github.com/ingfranciscastillo"
						className="flex size-8 items-center justify-center text-text-tertiary transition-colors hover:text-text-primary"
						aria-label="GitHub"
					>
						<SiGithub className="size-4" />
					</a>
					<a
						href="https://x.com/ingfranciscas"
						className="flex size-8 items-center justify-center text-text-tertiary transition-colors hover:text-text-primary"
						aria-label="X (Twitter)"
					>
						<SiX className="size-4" />
					</a>
					<a
						href="buymeacoffee.com/ingfranciscastillo"
						className="flex size-8 items-center justify-center text-text-tertiary transition-colors hover:text-text-primary"
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
									<a
										href="https://github.com/ingfranciscastillo"
										aria-label="GitHub"
									>
										<SiGithub className="size-5 text-text-tertiary transition-colors hover:text-text-primary" />
									</a>
									<a
										href="https://x.com/ingfranciscas"
										aria-label="X (Twitter)"
									>
										<SiX className="size-5 text-text-tertiary transition-colors hover:text-text-primary" />
									</a>
									<a
										href="buymeacoffee.com/ingfranciscastillo"
										aria-label="Buy Me a Coffee"
									>
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
