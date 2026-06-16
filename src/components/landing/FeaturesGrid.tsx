import { FileSearch, GitCompareArrows, WandSparkles } from "lucide-react";

const features = [
	{
		icon: FileSearch,
		title: "Schema Validation",
		description:
			"Automatically validate every API response against your OpenAPI spec. Catch missing fields, type mismatches, and contract violations before they reach production.",
	},
	{
		icon: WandSparkles,
		title: "Automated Mock Generation",
		description:
			"Generate realistic mock responses from your schema. Smart field-name heuristics, edge case coverage, and seeded deterministic output.",
	},
	{
		icon: GitCompareArrows,
		title: "Difference Detection",
		description:
			"Compare spec versions to identify breaking changes instantly. Know exactly what changed and whether it affects your consumers.",
	},
];

export function FeaturesGrid() {
	return (
		<section className="px-4 py-24" id="features">
			<div className="mx-auto max-w-6xl">
				<div className="mb-16 text-center">
					<h2 className="text-display-sm font-bold text-text-primary">
						Everything you need for API quality
					</h2>
					<p className="mt-4 text-lg text-text-secondary">
						From validation to mocks, a unified platform for your API lifecycle.
					</p>
				</div>
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{features.map((feature) => (
						<div
							key={feature.title}
							className="gradient-border-card group rounded-xl border border-border bg-surface p-6 transition-shadow hover:shadow-glow-blue"
						>
							<div
								className="mb-4 flex size-12 items-center justify-center rounded-lg bg-accent-blue/10 text-accent-blue"
								aria-hidden="true"
							>
								<feature.icon className="size-6" />
							</div>
							<h3 className="mb-2 text-lg font-semibold text-text-primary">
								{feature.title}
							</h3>
							<p className="text-sm leading-relaxed text-text-secondary">
								{feature.description}
							</p>
							<a
								href={`#${feature.title.toLowerCase().replace(/\s+/g, "-")}`}
								className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent-cyan transition-colors hover:text-accent-cyan/80"
							>
								Learn more
								<span aria-hidden="true" className="text-xs">
									→
								</span>
							</a>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
