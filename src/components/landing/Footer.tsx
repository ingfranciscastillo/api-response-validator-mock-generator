import { SiBuymeacoffee, SiGithub, SiX } from "@icons-pack/react-simple-icons";

const sections = [
	{
		title: "Product",
		links: [
			{ label: "Features", href: "#features" },
			{ label: "Pricing", href: "#" },
			{ label: "Changelog", href: "#" },
		],
	},
	{
		title: "Docs",
		links: [
			{ label: "Documentation", href: "#" },
			{ label: "API Reference", href: "#" },
			{ label: "Guides", href: "#" },
		],
	},
	{
		title: "Legal",
		links: [
			{ label: "Privacy Policy", href: "#" },
			{ label: "Terms of Service", href: "#" },
			{ label: "Security", href: "#" },
		],
	},
];

export function Footer() {
	return (
		<footer className="border-t border-border px-4 py-8">
			<div className="mx-auto max-w-6xl">
				<div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
					<div>
						<div className="mb-4 flex items-center gap-2">
							<div className="flex size-8 items-center justify-center rounded-lg bg-accent-blue text-sm font-bold text-white">
								AV
							</div>
							<span className="font-semibold text-text-primary">
								API Validator
							</span>
						</div>
						<p className="text-sm text-text-tertiary">
							Validate, mock, and ship APIs with confidence.
						</p>
					</div>
					{sections.map((section) => (
						<div key={section.title}>
							<h2 className="mb-3 text-sm font-semibold text-text-primary">
								{section.title}
							</h2>
							<ul className="space-y-2">
								{section.links.map((link) => (
									<li key={link.label}>
										<a
											href={link.href}
											className="text-sm text-text-tertiary transition-colors hover:text-text-primary"
										>
											{link.label}
										</a>
									</li>
								))}
							</ul>
						</div>
					))}
				</div>
				<div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
					<p className="text-xs text-text-tertiary">
						&copy; {new Date().getFullYear()} API Validator. All rights
						reserved.
					</p>
					<div className="flex items-center gap-4">
						<a
							href="https://github.com/ingfranciscastillo"
							className="text-text-tertiary transition-colors hover:text-text-primary"
							aria-label="GitHub"
						>
							<SiGithub className="size-5" />
						</a>
						<a
							href="https://x.com/ingfranciscas"
							className="text-text-tertiary transition-colors hover:text-text-primary"
							aria-label="X (Twitter)"
						>
							<SiX className="size-4" />
						</a>
						<a
							href="buymeacoffee.com/ingfranciscastillo"
							className="text-text-tertiary transition-colors hover:text-text-primary"
							aria-label="Buy Me a Coffee"
						>
							<SiBuymeacoffee className="size-4" />
						</a>
					</div>
				</div>
			</div>
		</footer>
	);
}
