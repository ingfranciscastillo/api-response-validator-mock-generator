import { SiBuymeacoffee, SiGithub, SiX } from "@icons-pack/react-simple-icons";
import { useTranslation } from "react-i18next";

const sections = [
	{
		title: "landing:footer.product",
		links: [
			{ label: "landing:footer.features", href: "#features" },
			{ label: "landing:footer.pricing", href: "#" },
			{ label: "landing:footer.changelog", href: "#" },
		],
	},
	{
		title: "landing:footer.developers",
		links: [
			{ label: "landing:footer.documentation", href: "#" },
			{ label: "landing:footer.apiReference", href: "#" },
			{ label: "landing:footer.guides", href: "#" },
		],
	},
	{
		title: "landing:footer.legal",
		links: [
			{ label: "landing:footer.privacy", href: "#" },
			{ label: "landing:footer.terms", href: "#" },
			{ label: "landing:footer.security", href: "#" },
		],
	},
];

export function Footer() {
	const { t } = useTranslation();
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
							{t("landing:footer.description")}
						</p>
					</div>
					{sections.map((section) => (
						<div key={section.title}>
							<h2 className="mb-3 text-sm font-semibold text-text-primary">
								{t(section.title)}
							</h2>
							<ul className="space-y-2">
								{section.links.map((link) => (
									<li key={link.label}>
										<a
											href={link.href}
											className="text-sm text-text-tertiary transition-colors hover:text-text-primary"
										>
											{t(link.label)}
										</a>
									</li>
								))}
							</ul>
						</div>
					))}
				</div>
				<div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
					<p className="text-xs text-text-tertiary">
						{t("landing:footer.copyright", { year: new Date().getFullYear() })}
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
