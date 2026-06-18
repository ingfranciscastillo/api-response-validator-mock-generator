import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { AlertTriangle, ArrowLeftRight, GitBranch, Users } from "lucide-react";
import { useRef } from "react";
import { useTranslation } from "react-i18next";

gsap.registerPlugin(ScrollTrigger);

export function AdvancedFeatures() {
	const sectionRef = useRef<HTMLElement>(null);
	const { t } = useTranslation();

	const features = [
		{
			icon: GitBranch,
			label: t("landing:advancedFeatures.customRules.title"),
			description: t("landing:advancedFeatures.customRules.description"),
		},
		{
			icon: AlertTriangle,
			label: t("landing:advancedFeatures.schemaComparison.title"),
			description: t("landing:advancedFeatures.schemaComparison.description"),
		},
		{
			icon: ArrowLeftRight,
			label: t("landing:advancedFeatures.performanceMetrics.title"),
			description: t("landing:advancedFeatures.performanceMetrics.description"),
		},
		{
			icon: Users,
			label: t("landing:advancedFeatures.webhookAlerts.title"),
			description: t("landing:advancedFeatures.webhookAlerts.description"),
		},
	];

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
		<section ref={sectionRef} className="px-4 py-20">
			<div className="mx-auto max-w-5xl">
				<div className="mb-12 text-center">
					<h2 className="text-display-sm font-bold text-text-primary">
						{t("landing:advancedFeatures.heading")}
					</h2>

					<p className="mt-4 text-lg text-text-secondary">
						{t("landing:advancedFeatures.subtitle")}
					</p>
				</div>
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
