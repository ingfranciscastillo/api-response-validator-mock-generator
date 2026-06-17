import { ArrowRight } from "lucide-react";
import { Button } from "#/components/ui/button";

export function CtaSection() {
	return (
		<section className="px-4 py-24">
			<div className="mx-auto max-w-3xl">
				<div className="rounded-2xl p-1">
					<div className="rounded-[calc(1rem-1px)] bg-background px-8 py-16 text-center">
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
