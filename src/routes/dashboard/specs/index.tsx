import { createFileRoute, Link } from "@tanstack/react-router";
import { BookUp, ChevronRight, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "#/components/ui/button";
import { EmptyState } from "#/components/ui/empty-state";
import { Input } from "#/components/ui/input";
import { Skeleton } from "#/components/ui/skeleton";
import { getSpecs } from "#/lib/specs/functions";

export const Route = createFileRoute("/dashboard/specs/")({
	head: () => ({
		meta: [
			{
				title: "Specifications — API Response Validator & Mock Generator",
			},
		],
	}),
	component: SpecsPage,
});

function SpecsPage() {
	const [specs, setSpecs] = useState<Awaited<ReturnType<typeof getSpecs>>>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [search, setSearch] = useState("");

	const fetchSpecs = (searchTerm: string) => {
		setLoading(true);
		getSpecs({ data: { search: searchTerm || undefined } })
			.then(setSpecs)
			.catch((err) =>
				setError(
					err instanceof Error ? err.message : "Failed to load specifications",
				),
			)
			.finally(() => setLoading(false));
	};

	useEffect(() => {
		fetchSpecs("");
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
				<Button asChild>
					<Link to="/dashboard/specs/new">
						<BookUp className="size-4" />
						Add Specification
					</Link>
				</Button>
			</div>

			<div className="relative max-w-sm">
				<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					placeholder="Search specifications..."
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") fetchSpecs(search);
					}}
					className="pl-9"
				/>
			</div>

			{loading ? (
				<div className="space-y-2">
					{Array.from({ length: 3 }).map((_, i) => (
						<div key={i} className="rounded-lg border p-4">
							<div className="space-y-2">
								<Skeleton className="h-5 w-48" />
								<Skeleton className="h-4 w-72" />
								<Skeleton className="h-3 w-24" />
							</div>
						</div>
					))}
				</div>
			) : error ? (
				<div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
					{error}
				</div>
			) : specs.length === 0 ? (
				<EmptyState
					icon={<BookUp className="size-8" />}
					title="No specifications yet"
					description="Upload an OpenAPI spec to get started"
					action={
						<Button asChild>
							<Link to="/dashboard/specs/new">
								<BookUp className="size-4" />
								Add Specification
							</Link>
						</Button>
					}
				/>
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
