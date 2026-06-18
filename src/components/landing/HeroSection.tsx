import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ArrowRight, Play } from "lucide-react";
import { useRef } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "#/components/ui/button";

interface HeroSectionProps {
	onViewDemo: () => void;
}

export function HeroSection({ onViewDemo }: HeroSectionProps) {
	const { t } = useTranslation();
	const containerRef = useRef<HTMLElement>(null);

	useGSAP(
		() => {
			const tl = gsap.timeline({
				defaults: { ease: "power3.out", duration: 0.6 },
			});
			tl.fromTo(".hero-title", { y: 40, opacity: 0 }, { y: 0, opacity: 1 })
				.fromTo(
					".hero-subtitle",
					{ y: 30, opacity: 0 },
					{ y: 0, opacity: 1 },
					"-=0.3",
				)
				.fromTo(
					".hero-buttons",
					{ y: 20, opacity: 0 },
					{ y: 0, opacity: 1 },
					"-=0.2",
				);
		},
		{ scope: containerRef },
	);

	return (
		<section
			ref={containerRef}
			className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-4 py-24"
		>
			<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(59,130,246,0.15),transparent),radial-gradient(ellipse_60%_40%_at_80%_10%,rgba(167,139,250,0.1),transparent)]" />
			<div className="relative z-10 mx-auto max-w-3xl text-center">
				<h1 className="hero-title text-display text-balance font-bold tracking-tight">
					{t("landing:hero.title1")}
					<br />
					<span className="bg-accent-blue bg-clip-text text-transparent">
						{t("landing:hero.title2")}
					</span>
					<br />
					{t("landing:hero.title3")}
				</h1>
				<p className="hero-subtitle mx-auto mt-6 max-w-2xl text-balance text-lg text-text-secondary">
					{t("landing:hero.subtitle")}
				</p>
				<div className="hero-buttons mt-8 flex flex-wrap items-center justify-center gap-4">
					<Button size="lg" asChild>
						<a href="/register">
							{t("landing:hero.startValidating")}
							<ArrowRight className="ml-2 size-4" />
						</a>
					</Button>
					<Button variant="outline" size="lg" onClick={onViewDemo}>
						<Play className="mr-2 size-4" />
						{t("landing:hero.viewDemo")}
					</Button>
				</div>
			</div>
		</section>
	);
}
