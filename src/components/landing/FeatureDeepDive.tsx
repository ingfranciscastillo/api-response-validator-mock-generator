import type { ReactNode } from "react";

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
	return (
		<section
			className="border-b border-border px-4 py-24 last:border-b-0"
			id={id}
		>
			<div className="mx-auto max-w-6xl">
				<div
					className={`flex flex-col items-center gap-12 lg:flex-row ${
						isReversed ? "lg:flex-row-reverse" : ""
					}`}
				>
					<div className="flex-1">{children}</div>
					<div className="flex-1">
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
