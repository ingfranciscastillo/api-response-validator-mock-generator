import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { ReactNode } from "react";
import { useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

interface FeatureDeepDiveProps {
	title: string;
	description: string;
	isReversed?: boolean;
	id?: string;
	children: ReactNode;
}

export function FeatureDeepDive({
	title,
	description,
	isReversed = false,
	id,
	children,
}: FeatureDeepDiveProps) {
	const sectionRef = useRef<HTMLElement>(null);

	useGSAP(
		() => {
			const visualSlide = isReversed ? 60 : -60;
			const textSlide = isReversed ? -60 : 60;

			gsap.fromTo(
				".fdd-visual",
				{ x: visualSlide, opacity: 0 },
				{
					x: 0,
					opacity: 1,
					duration: 0.7,
					ease: "power3.out",
					scrollTrigger: {
						trigger: sectionRef.current,
						start: "top 75%",
						toggleActions: "play none none none",
					},
				},
			);

			gsap.fromTo(
				".fdd-text",
				{ x: textSlide, opacity: 0 },
				{
					x: 0,
					opacity: 1,
					duration: 0.7,
					ease: "power3.out",
					scrollTrigger: {
						trigger: sectionRef.current,
						start: "top 75%",
						toggleActions: "play none none none",
					},
				},
			);
		},
		{ scope: sectionRef },
	);

	return (
		<section
			ref={sectionRef}
			className="border-b border-border px-4 py-24 last:border-b-0"
			id={id}
		>
			<div className="mx-auto max-w-6xl">
				<div
					className={`flex flex-col items-center gap-12 lg:flex-row ${
						isReversed ? "lg:flex-row-reverse" : ""
					}`}
				>
					<div className="fdd-visual flex-1">{children}</div>
					<div className="fdd-text flex-1">
						<h2 className="text-display-sm font-bold text-text-primary">
							{title}
						</h2>
						<p className="mt-4 text-lg leading-relaxed text-text-secondary">
							{description}
						</p>
						<a
							href="/register"
							className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-accent-cyan transition-colors hover:text-accent-cyan/80"
						>
							Try it now
							<span aria-hidden="true">→</span>
						</a>
					</div>
				</div>
			</div>
		</section>
	);
}
