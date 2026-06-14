import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/validation")({
	component: ValidationPage,
});

function ValidationPage() {
	return (
		<div className="flex flex-col gap-4">
			<div>
				<h2 className="text-2xl font-bold">Validation</h2>
				<p className="text-text-secondary mt-1">
					Test and validate API responses against your specifications
				</p>
			</div>
			<div className="rounded-lg border border-border bg-surface p-8 text-center">
				<p className="text-text-tertiary">No validation runs yet</p>
				<p className="text-text-tertiary text-sm mt-1">
					Send a request to an endpoint to start validating
				</p>
			</div>
		</div>
	);
}
