import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight } from "lucide-react";
import { useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

import { Button } from "#/components/ui/button";

export function CtaSection() {
	const sectionRef = useRef<HTMLElement>(null);

	useGSAP(
		() => {
			gsap.fromTo(
				".cta-content",
				{ y: 30, opacity: 0 },
				{
					y: 0,
					opacity: 1,
					duration: 0.6,
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
		<section ref={sectionRef} className="px-4 py-24">
			<div className="mx-auto max-w-3xl">
				<div className="rounded-2xl p-1">
					<div className="cta-content rounded-[calc(1rem-1px)] bg-background px-8 py-16 text-center">
						<h2 className="text-display-sm font-bold text-text-primary">
							Ship APIs your team can trust
						</h2>
						<p className="mx-auto mt-4 max-w-lg text-lg text-text-secondary">
							Join teams that use API Validator to catch issues before they
							reach production.
						</p>
						<Button size="lg" className="mt-8" asChild>
							<a href="/register">
								Start Validating APIs
								<ArrowRight className="ml-2 size-4" />
							</a>
						</Button>
					</div>
				</div>
			</div>
		</section>
	);
}
