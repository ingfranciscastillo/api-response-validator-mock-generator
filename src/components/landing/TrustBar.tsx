export function TrustBar() {
	return (
		<section className="border-y border-border px-4 py-12">
			<div className="mx-auto max-w-5xl text-center">
				<p className="mb-8 text-sm font-medium uppercase tracking-widest text-text-tertiary">
					Trusted by engineering teams at
				</p>
				<div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
					{["Acme Corp", "TechFlow", "DataBridge", "StackLab", "CloudPeak"].map(
						(name) => (
							<div
								key={name}
								className="flex h-8 items-center rounded-md border border-border px-4 text-sm text-text-tertiary"
							>
								{name}
							</div>
						),
					)}
				</div>
			</div>
		</section>
	);
}
