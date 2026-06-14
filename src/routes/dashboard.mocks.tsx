import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/mocks")({
	component: MocksPage,
});

function MocksPage() {
	return (
		<div className="flex flex-col gap-4">
			<div>
				<h2 className="text-2xl font-bold">Mocks</h2>
				<p className="text-text-secondary mt-1">
					Generate and manage mock data for your API endpoints
				</p>
			</div>
			<div className="rounded-lg border border-border bg-surface p-8 text-center">
				<p className="text-text-tertiary">No mock datasets yet</p>
				<p className="text-text-tertiary text-sm mt-1">
					Generate mocks from your specifications
				</p>
			</div>
		</div>
	);
}
