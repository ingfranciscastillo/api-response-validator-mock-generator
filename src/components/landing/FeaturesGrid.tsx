import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { FileSearch, GitCompareArrows, WandSparkles } from "lucide-react";
import { useRef } from "react";
import { useTranslation } from "react-i18next";

gsap.registerPlugin(ScrollTrigger);

export function FeaturesGrid() {
	const sectionRef = useRef<HTMLElement>(null);
	const { t } = useTranslation();

	const features = [
		{
			icon: FileSearch,
			title: t("landing:features.validation.title"),
			description: t("landing:features.validation.description"),
		},
		{
			icon: WandSparkles,
			title: t("landing:features.mockGeneration.title"),
			description: t("landing:features.mockGeneration.description"),
		},
		{
			icon: GitCompareArrows,
			title: t("landing:features.driftDetection.title"),
			description: t("landing:features.driftDetection.description"),
		},
	];

	useGSAP(
		() => {
			gsap.fromTo(
				".feature-card",
				{ y: 50, opacity: 0 },
				{
					y: 0,
					opacity: 1,
					duration: 0.6,
					stagger: 0.15,
					ease: "power3.out",
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
		<section ref={sectionRef} className="px-4 py-24" id="features">
			<div className="mx-auto max-w-6xl">
				<div className="mb-16 text-center">
					<h2 className="text-display-sm font-bold text-text-primary">
						{t("landing:features.heading")}
					</h2>
					<p className="mt-4 text-lg text-text-secondary">
						{t("landing:features.subtitle")}
					</p>
				</div>
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{features.map((feature) => (
						<div
							key={feature.title}
							className="feature-card gradient-border-card group rounded-xl border border-border bg-surface p-6 transition-shadow hover:shadow-glow-blue"
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
								href="#features"
								className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent-cyan transition-colors hover:text-accent-cyan/80"
							>
								{t("common:learnMore")}
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
