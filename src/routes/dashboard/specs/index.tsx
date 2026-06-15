import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { getSpecs } from "#/lib/specs/functions";

export const Route = createFileRoute("/dashboard/specs/")({
	component: SpecsPage,
});

function SpecsPage() {
	const [specs, setSpecs] = useState<Awaited<ReturnType<typeof getSpecs>>>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		getSpecs()
			.then(setSpecs)
			.finally(() => setLoading(false));
	}, []);

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold">Specifications</h2>
					<p className="text-muted-foreground mt-1">
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
				<div className="rounded-lg border p-8 text-center">
					<p className="text-muted-foreground">Loading...</p>
				</div>
			) : specs.length === 0 ? (
				<div className="rounded-lg border p-8 text-center">
					<p className="text-muted-foreground">No specifications yet</p>
					<p className="text-muted-foreground text-sm mt-1">
						Upload an OpenAPI spec to get started
					</p>
				</div>
			) : (
				<div className="grid gap-4">
					{specs.map((spec) => (
						<Link
							key={spec.id}
							to="/dashboard/specs/$specId"
							params={{ specId: spec.id }}
							className="rounded-lg border p-4 hover:bg-muted/50 transition-colors"
						>
							<div className="flex items-center justify-between">
								<div>
									<h3 className="font-semibold">{spec.name}</h3>
									{spec.description && (
										<p className="text-muted-foreground text-sm mt-1">
											{spec.description}
										</p>
									)}
									<p className="text-muted-foreground text-xs mt-2">
										Created {new Date(spec.createdAt).toLocaleDateString()}
									</p>
								</div>
								<ChevronRight className="size-4 text-muted-foreground" />
							</div>
						</Link>
					))}
				</div>
			)}
		</div>
	);
}
