import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { AlertTriangle, ArrowLeftRight, GitBranch, Users } from "lucide-react";
import { useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

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
	const sectionRef = useRef<HTMLElement>(null);

	useGSAP(
		() => {
			gsap.fromTo(
				".af-item",
				{ scale: 0.8, opacity: 0 },
				{
					scale: 1,
					opacity: 1,
					duration: 0.5,
					stagger: 0.1,
					ease: "back.out(1.4)",
					scrollTrigger: {
						trigger: sectionRef.current,
						start: "top 80%",
						toggleActions: "play none none none",
					},
				},
			);
		},
		{ scope: sectionRef },
	);

	return (
		<section ref={sectionRef} className="border-y border-border px-4 py-20">
			<div className="mx-auto max-w-5xl">
				<h2 className="sr-only">Advanced features</h2>
				<div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
					{features.map((f) => (
						<div key={f.label} className="af-item text-center">
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
