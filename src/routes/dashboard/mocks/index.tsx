import { createFileRoute } from "@tanstack/react-router";
import { FlaskConical, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { MockCard } from "#/components/mocks/mock-card";
import { MockGenerationModal } from "#/components/mocks/mock-generation-modal";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import type { mockDataset } from "#/db/schema";
import { getMocks } from "#/lib/mocks/functions";
import { getSpecs } from "#/lib/specs/functions";

type MockRow = typeof mockDataset.$inferSelect;

export const Route = createFileRoute("/dashboard/mocks/")({
	component: MocksPage,
});

function MocksPage() {
	const [mocks, setMocks] = useState<MockRow[]>([]);
	const [loading, setLoading] = useState(true);
	const [modalOpen, setModalOpen] = useState(false);
	const [search, setSearch] = useState("");
	const [specFilter, setSpecFilter] = useState("all");

	const [specs, setSpecs] = useState<Awaited<ReturnType<typeof getSpecs>>>([]);

	const fetchMocks = useCallback(() => {
		setLoading(true);
		getMocks({
			data: {
				organizationId: "",
				search: search || undefined,
				specId: specFilter !== "all" ? specFilter : undefined,
			},
		})
			.then(setMocks)
			.finally(() => setLoading(false));
	}, [search, specFilter]);

	useEffect(() => {
		fetchMocks();
	}, [fetchMocks]);

	useEffect(() => {
		getSpecs({ data: { organizationId: "" } }).then(setSpecs);
	}, []);

	const handleSearch = () => {
		fetchMocks();
	};

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold">Mocks</h2>
					<p className="text-muted-foreground mt-1">
						Generate and manage mock data for your API endpoints
					</p>
				</div>
				<Button onClick={() => setModalOpen(true)} className="gap-1">
					<FlaskConical className="size-4" />
					Generate Mock
				</Button>
			</div>

			<div className="flex items-center gap-2">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						placeholder="Search mocks..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") handleSearch();
						}}
						className="pl-9"
					/>
				</div>
				<Select value={specFilter} onValueChange={setSpecFilter}>
					<SelectTrigger className="w-[200px]">
						<SelectValue placeholder="All specs" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Specs</SelectItem>
						{specs.map((spec) => (
							<SelectItem key={spec.id} value={spec.id}>
								{spec.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{loading ? (
				<div className="rounded-lg border p-8 text-center">
					<p className="text-muted-foreground">Loading...</p>
				</div>
			) : mocks.length === 0 ? (
				<div className="rounded-lg border p-8 text-center">
					<p className="text-muted-foreground">No mock datasets yet</p>
					<p className="text-muted-foreground text-sm mt-1">
						Generate mocks from your specifications
					</p>
				</div>
			) : (
				<div className="grid gap-3">
					{mocks.map((mock) => (
						<MockCard key={mock.id} mock={mock} />
					))}
				</div>
			)}

			<MockGenerationModal
				open={modalOpen}
				onOpenChange={setModalOpen}
				onGenerated={fetchMocks}
			/>
		</div>
	);
}
