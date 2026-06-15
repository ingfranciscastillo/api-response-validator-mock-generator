import { createFileRoute } from "@tanstack/react-router";
import {
	Activity,
	AlertTriangle,
	ArrowLeftRight,
	CheckCircle,
	FileCheck,
	FileSearch,
	GitCompareArrows,
	WandSparkles,
	Zap,
} from "lucide-react";
import { useCallback, useRef } from "react";

import { AdvancedFeatures } from "#/components/landing/AdvancedFeatures";
import { CtaSection } from "#/components/landing/CtaSection";
import { DashboardPreview } from "#/components/landing/DashboardPreview";
import { FeatureDeepDive } from "#/components/landing/FeatureDeepDive";
import { FeaturesGrid } from "#/components/landing/FeaturesGrid";
import { Footer } from "#/components/landing/Footer";
import { HeroSection } from "#/components/landing/HeroSection";
import { TrustBar } from "#/components/landing/TrustBar";

export const Route = createFileRoute("/")({
	component: LandingPage,
});

function LandingPage() {
	const demoRef = useRef<HTMLDivElement>(null);

	const scrollToDemo = useCallback(() => {
		demoRef.current?.scrollIntoView({ behavior: "smooth" });
	}, []);

	return (
		<main className="min-h-svh bg-background">
			<HeroSection onViewDemo={scrollToDemo} />
			<TrustBar />
			<FeaturesGrid />

			<section id="schema-validation">
				<FeatureDeepDive
					title="Schema Validation"
					description="Every API response is automatically validated against your OpenAPI specification. Missing fields, type mismatches, additional properties — all caught in real-time with precise violation reporting."
				>
					<div className="glass-panel overflow-hidden">
						<div className="border-b border-border px-4 py-3">
							<div className="flex items-center gap-2">
								<FileSearch className="size-4 text-accent-blue" />
								<span className="text-sm font-medium text-text-primary">
									Validation Result
								</span>
							</div>
						</div>
						<div className="space-y-3 p-4">
							<div className="flex items-center gap-3 rounded-lg border border-success/20 bg-success/5 px-4 py-3">
								<CheckCircle className="size-5 text-success" />
								<div className="text-sm">
									<span className="font-medium text-text-primary">200 OK</span>
									<span className="ml-2 text-text-secondary">
										— Schema matches specification
									</span>
								</div>
							</div>
							<div className="flex items-center gap-3 rounded-lg border border-error/20 bg-error/5 px-4 py-3">
								<AlertTriangle className="size-5 text-error" />
								<div className="text-sm">
									<span className="font-medium text-text-primary">
										400 Bad Request
									</span>
									<span className="ml-2 text-text-secondary">
										— Missing required field: userId
									</span>
								</div>
							</div>
							<div className="flex items-center gap-3 rounded-lg border border-warning/20 bg-warning/5 px-4 py-3">
								<AlertTriangle className="size-5 text-warning" />
								<div className="text-sm">
									<span className="font-medium text-text-primary">
										Type Mismatch
									</span>
									<span className="ml-2 text-text-secondary">
										— Expected string, got number at $.age
									</span>
								</div>
							</div>
						</div>
					</div>
				</FeatureDeepDive>
			</section>

			<section id="automated-mock-generation">
				<FeatureDeepDive
					title="Automated Mock Generation"
					description="Generate realistic mock data directly from your OpenAPI schema. Smart field-name heuristics, edge case variants, and deterministic seeding ensure your mocks are production-ready."
					isReversed
				>
					<div className="glass-panel overflow-hidden">
						<div className="border-b border-border px-4 py-3">
							<div className="flex items-center gap-2">
								<WandSparkles className="size-4 text-accent-cyan" />
								<span className="text-sm font-medium text-text-primary">
									Generated Mocks
								</span>
							</div>
						</div>
						<div className="divide-y divide-border p-4">
							<div className="flex items-center justify-between py-2">
								<div className="flex items-center gap-3">
									<div className="size-2 rounded-full bg-success" />
									<span className="text-sm text-text-primary">
										GET /users/:id
									</span>
								</div>
								<div className="flex gap-1">
									<span className="rounded-md bg-surface-elevated px-2 py-0.5 text-xs text-text-tertiary">
										200
									</span>
									<span className="rounded-md bg-accent-blue/10 px-2 py-0.5 text-xs text-accent-blue">
										Standard
									</span>
								</div>
							</div>
							<div className="flex items-center justify-between py-2">
								<div className="flex items-center gap-3">
									<div className="size-2 rounded-full bg-warning" />
									<span className="text-sm text-text-primary">POST /users</span>
								</div>
								<div className="flex gap-1">
									<span className="rounded-md bg-surface-elevated px-2 py-0.5 text-xs text-text-tertiary">
										201
									</span>
									<span className="rounded-md bg-accent-violet/10 px-2 py-0.5 text-xs text-accent-violet">
										Edge Case
									</span>
								</div>
							</div>
							<div className="flex items-center justify-between py-2">
								<div className="flex items-center gap-3">
									<div className="size-2 rounded-full bg-error" />
									<span className="text-sm text-text-primary">
										DELETE /users/:id
									</span>
								</div>
								<div className="flex gap-1">
									<span className="rounded-md bg-surface-elevated px-2 py-0.5 text-xs text-text-tertiary">
										404
									</span>
									<span className="rounded-md bg-error/10 px-2 py-0.5 text-xs text-error">
										Error
									</span>
								</div>
							</div>
						</div>
					</div>
				</FeatureDeepDive>
			</section>

			<section id="difference-detection">
				<FeatureDeepDive
					title="Difference Detection"
					description="Compare API specification versions side-by-side. Instantly identify added, removed, and changed endpoints with clear breaking-change risk assessment."
				>
					<div className="glass-panel overflow-hidden">
						<div className="border-b border-border px-4 py-3">
							<div className="flex items-center gap-2">
								<GitCompareArrows className="size-4 text-accent-violet" />
								<span className="text-sm font-medium text-text-primary">
									Version Comparison
								</span>
							</div>
						</div>
						<div className="space-y-1 p-4">
							<div className="flex items-center gap-3 rounded-lg border border-success/20 bg-success/5 px-4 py-2.5">
								<ArrowLeftRight className="size-4 text-success" />
								<span className="text-sm text-text-primary">POST /orders</span>
								<span className="ml-auto rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
									Added
								</span>
							</div>
							<div className="flex items-center gap-3 rounded-lg border border-error/20 bg-error/5 px-4 py-2.5">
								<ArrowLeftRight className="size-4 text-error" />
								<span className="text-sm text-text-primary">
									PATCH /users/:id
								</span>
								<span className="ml-auto rounded-full bg-error/10 px-2 py-0.5 text-xs font-medium text-error">
									Breaking
								</span>
							</div>
							<div className="flex items-center gap-3 rounded-lg border border-warning/20 bg-warning/5 px-4 py-2.5">
								<ArrowLeftRight className="size-4 text-warning" />
								<span className="text-sm text-text-primary">
									GET /users/:id/orders
								</span>
								<span className="ml-auto rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
									Changed
								</span>
							</div>
						</div>
					</div>
				</FeatureDeepDive>
			</section>

			<section id="api-testing-workspace">
				<FeatureDeepDive
					title="API Testing Workspace"
					description="An interactive workspace to test any endpoint. Select a spec and endpoint, build a request with parameters and headers, send it, and see validation results instantly."
					isReversed
				>
					<div className="glass-panel overflow-hidden">
						<div className="border-b border-border px-4 py-3">
							<div className="flex items-center gap-2">
								<Zap className="size-4 text-warning" />
								<span className="text-sm font-medium text-text-primary">
									Testing Workspace
								</span>
							</div>
						</div>
						<div className="p-4">
							<div className="mb-3 flex items-center gap-2">
								<span className="rounded-md bg-accent-blue px-2 py-0.5 text-xs font-bold text-white">
									GET
								</span>
								<code className="flex-1 rounded bg-surface-elevated px-3 py-1.5 text-sm text-text-secondary">
									https://api.example.com/users?limit=10
								</code>
							</div>
							<div className="mb-3 flex items-center gap-2 text-sm text-text-tertiary">
								<FileCheck className="size-4" />
								<span>Validating against User Service spec v2.3.1</span>
							</div>
							<div className="rounded-lg bg-surface-elevated p-3">
								<div className="mb-1 flex items-center justify-between">
									<span className="text-xs font-medium text-text-tertiary">
										Response Body
									</span>
									<span className="rounded-full bg-success/10 px-2 py-0.5 text-xs text-success">
										200 OK
									</span>
								</div>
								<pre className="text-xs text-text-secondary">
									{JSON.stringify(
										{
											users: [{ id: 1, name: "Jane Doe", email: "jane@..." }],
											total: 42,
											page: 1,
										},
										null,
										2,
									)}
								</pre>
							</div>
						</div>
					</div>
				</FeatureDeepDive>
			</section>

			<section id="reporting">
				<FeatureDeepDive
					title="Reporting & Analytics"
					description="Generate comprehensive validation reports with charts, violation summaries, and export options. Share findings with your team in HTML, PDF, or JSON format."
				>
					<div className="glass-panel overflow-hidden">
						<div className="border-b border-border px-4 py-3">
							<div className="flex items-center gap-2">
								<Activity className="size-4 text-accent-blue" />
								<span className="text-sm font-medium text-text-primary">
									Validation Summary
								</span>
							</div>
						</div>
						<div className="p-4">
							<div className="mb-4 grid grid-cols-3 gap-3">
								<div className="rounded-lg border border-border p-3 text-center">
									<div className="text-2xl font-bold text-success">42</div>
									<div className="text-xs text-text-tertiary">Passed</div>
								</div>
								<div className="rounded-lg border border-border p-3 text-center">
									<div className="text-2xl font-bold text-warning">8</div>
									<div className="text-xs text-text-tertiary">Warnings</div>
								</div>
								<div className="rounded-lg border border-border p-3 text-center">
									<div className="text-2xl font-bold text-error">3</div>
									<div className="text-xs text-text-tertiary">Failed</div>
								</div>
							</div>
							<div className="flex gap-2">
								<span className="rounded-md bg-surface-elevated px-3 py-1.5 text-xs text-text-secondary">
									HTML
								</span>
								<span className="rounded-md bg-surface-elevated px-3 py-1.5 text-xs text-text-secondary">
									PDF
								</span>
								<span className="rounded-md bg-surface-elevated px-3 py-1.5 text-xs text-text-secondary">
									JSON
								</span>
							</div>
						</div>
					</div>
				</FeatureDeepDive>
			</section>

			<div ref={demoRef}>
				<DashboardPreview />
			</div>

			<AdvancedFeatures />
			<CtaSection />
			<Footer />
		</main>
	);
}
