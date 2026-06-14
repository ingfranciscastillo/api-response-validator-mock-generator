import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getSpecs } from "#/lib/specs/functions";

export const Route = createFileRoute("/dashboard/specs")({
	component: SpecsPage,
});

function SpecsPage() {
	const [specs, setSpecs] = useState<Awaited<ReturnType<typeof getSpecs>>>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		getSpecs({ data: { organizationId: "" } })
			.then(setSpecs)
			.finally(() => setLoading(false));
	}, []);

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold">Specifications</h2>
					<p className="text-text-secondary mt-1">
						Manage your API specifications and OpenAPI documents
					</p>
				</div>
				<Link
					to="/dashboard/specs/new"
					className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
				>
					Add Specification
				</Link>
			</div>

			{loading ? (
				<div className="rounded-lg border border-border bg-surface p-8 text-center">
					<p className="text-text-tertiary">Loading...</p>
				</div>
			) : specs.length === 0 ? (
				<div className="rounded-lg border border-border bg-surface p-8 text-center">
					<p className="text-text-tertiary">No specifications yet</p>
					<p className="text-text-tertiary text-sm mt-1">
						Upload an OpenAPI spec to get started
					</p>
				</div>
			) : (
				<div className="grid gap-4">
					{specs.map((spec) => (
						<div
							key={spec.id}
							className="rounded-lg border border-border bg-surface p-4"
						>
							<h3 className="font-semibold">{spec.name}</h3>
							{spec.description && (
								<p className="text-text-secondary text-sm mt-1">
									{spec.description}
								</p>
							)}
							<p className="text-text-tertiary text-xs mt-2">
								Created {new Date(spec.createdAt).toLocaleDateString()}
							</p>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
