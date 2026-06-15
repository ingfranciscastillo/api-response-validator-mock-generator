import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import {
	ArrowRight,
	FileSearch,
	ShieldCheck,
	Sparkles,
	TestTube,
} from "lucide-react";
import { useRef } from "react";

const steps = [
	{ icon: FileSearch, label: "OpenAPI Spec", desc: "Upload or import" },
	{ icon: TestTube, label: "API Response", desc: "Real request data" },
	{ icon: ShieldCheck, label: "Validation Engine", desc: "Schema checks" },
	{ icon: Sparkles, label: "Mock Generator", desc: "Perfect mocks" },
];

gsap.registerPlugin(useGSAP);

export function HeroPipeline() {
	const containerRef = useRef<HTMLDivElement>(null);
	const rayRef = useRef<SVGSVGElement>(null);

	useGSAP(
		() => {
			const boxes = containerRef.current?.querySelectorAll(".pipeline-box");
			const rays = rayRef.current?.querySelectorAll(".pipeline-ray");

			if (!boxes?.length) return;

			gsap.set(boxes, { opacity: 0, y: 30, scale: 0.9 });
			if (rays) gsap.set(rays, { opacity: 0, scaleX: 0 });

			const tl = gsap.timeline({
				defaults: { ease: "power3.out", duration: 0.6 },
			});

			boxes.forEach((box, i) => {
				tl.to(box, { opacity: 1, y: 0, scale: 1 }, i === 0 ? 0 : ">-0.2");
				if (rays?.[i]) {
					tl.to(
						rays[i],
						{ opacity: 1, scaleX: 1, transformOrigin: "left center" },
						"<",
					);
				}
			});
		},
		{ scope: containerRef },
	);

	return (
		<div
			ref={containerRef}
			className="relative mx-auto mt-12 flex max-w-4xl items-center justify-center gap-0"
		>
			{steps.map((step, i) => (
				<div key={step.label} className="flex items-center gap-0">
					<div className="pipeline-box glass-panel flex flex-col items-center gap-2 px-5 py-4 text-center">
						<step.icon className="size-7 text-accent-blue" />
						<div className="text-sm font-semibold text-text-primary">
							{step.label}
						</div>
						<div className="text-xs text-text-tertiary">{step.desc}</div>
					</div>
					{i < steps.length - 1 && (
						<div className="flex items-center justify-center px-2">
							<ArrowRight className="pipeline-ray size-5 text-accent-cyan" />
						</div>
					)}
				</div>
			))}
		</div>
	);
}
