import { AlertTriangle, ArrowLeftRight, GitBranch, Users } from "lucide-react";

const features = [
	{
		icon: GitBranch,
		label: "Contract Drift Detection",
		description: "Monitor specs for drift automatically",
	},
	{
		icon: AlertTriangle,
		label: "Breaking Change Alerts",
		description: "Get notified before it breaks production",
	},
	{
		icon: ArrowLeftRight,
		label: "Version Comparison",
		description: "See exactly what changed between versions",
	},
	{
		icon: Users,
		label: "Team Collaboration",
		description: "Share specs, runs, and mocks with your team",
	},
];

export function AdvancedFeatures() {
	return (
		<section className="border-y border-border px-4 py-20">
			<div className="mx-auto max-w-5xl">
				<h2 className="sr-only">Advanced features</h2>
				<div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
					{features.map((f) => (
						<div key={f.label} className="text-center">
							<div
								className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-accent-violet/10 text-accent-violet"
								aria-hidden="true"
							>
								<f.icon className="size-6" />
							</div>
							<h3 className="font-semibold text-text-primary">{f.label}</h3>
							<p className="mt-1 text-sm text-text-tertiary">{f.description}</p>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
