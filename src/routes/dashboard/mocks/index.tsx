import { createFileRoute } from "@tanstack/react-router";
import { FlaskConical, Search, TestTubes } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { MockCard } from "#/components/mocks/mock-card";
import { MockGenerationModal } from "#/components/mocks/mock-generation-modal";
import { Button } from "#/components/ui/button";
import { EmptyState } from "#/components/ui/empty-state";
import { Input } from "#/components/ui/input";
import { PaginationControls } from "#/components/ui/pagination-controls";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import { Skeleton } from "#/components/ui/skeleton";
import type { mockDataset } from "#/db/schema";
import { getMocks } from "#/lib/mocks/functions";
import { getSpecs } from "#/lib/specs/functions";

type MockRow = typeof mockDataset.$inferSelect;

export const Route = createFileRoute("/dashboard/mocks/")({
	head: () => ({
		meta: [
			{
				title: "Mock Endpoints — API Response Validator & Mock Generator",
			},
		],
	}),
	component: MocksPage,
});

const DEFAULT_PAGE_SIZE = 25;

function MocksPage() {
	const { t } = useTranslation();
	const [mocks, setMocks] = useState<MockRow[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [modalOpen, setModalOpen] = useState(false);
	const [search, setSearch] = useState("");
	const [specFilter, setSpecFilter] = useState("all");
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
	const [total, setTotal] = useState(0);
	const [totalPages, setTotalPages] = useState(0);

	const [specs, setSpecs] = useState<Awaited<ReturnType<typeof getSpecs>>>([]);

	const fetchMocks = useCallback(() => {
		setLoading(true);
		setError(null);
		getMocks({
			data: {
				search: search || undefined,
				specId: specFilter !== "all" ? specFilter : undefined,
				page,
				pageSize,
			},
		})
			.then((data) => {
				setMocks(data.mocks);
				setTotal(data.total);
				setTotalPages(data.totalPages);
			})
			.catch((err) =>
				setError(err instanceof Error ? err.message : "Failed to load mocks"),
			)
			.finally(() => setLoading(false));
	}, [search, specFilter, page, pageSize]);

	useEffect(() => {
		fetchMocks();
	}, [fetchMocks]);

	useEffect(() => {
		getSpecs({ data: {} }).then(setSpecs);
	}, []);

	const handleSearch = () => {
		setPage(1);
		fetchMocks();
	};

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold">{t("dashboard:mocks.title")}</h2>
					<p className="text-muted-foreground mt-1">
						{t("dashboard:mocks.description")}
					</p>
				</div>
				<Button onClick={() => setModalOpen(true)} className="gap-1">
					<FlaskConical className="size-4" />
					{t("dashboard:mocks.generateMock")}
				</Button>
			</div>

			<div className="flex items-center gap-2">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						placeholder={t("dashboard:mocks.searchPlaceholder")}
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
						<SelectValue placeholder={t("dashboard:mocks.allSpecs")} />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">{t("dashboard:mocks.allSpecs")}</SelectItem>
						{specs.map((spec) => (
							<SelectItem key={spec.id} value={spec.id}>
								{spec.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{loading ? (
				<div className="grid gap-3">
					{Array.from({ length: 3 }).map((_, i) => (
						<div key={i} className="rounded-lg border p-4">
							<div className="space-y-2">
								<Skeleton className="h-5 w-40" />
								<Skeleton className="h-4 w-56" />
							</div>
						</div>
					))}
				</div>
			) : error ? (
				<div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
					{error}
				</div>
			) : mocks.length === 0 ? (
				<EmptyState
					icon={<TestTubes className="size-8" />}
					title={t("dashboard:mocks.noMocks")}
					description={t("dashboard:mocks.noMocksDescription")}
				/>
			) : (
				<>
					<div className="grid gap-3">
						{mocks.map((mock) => (
							<MockCard key={mock.id} mock={mock} />
						))}
					</div>
					<PaginationControls
						page={page}
						totalPages={totalPages}
						total={total}
						pageSize={pageSize}
						onPageChange={setPage}
						onPageSizeChange={(s) => {
							setPageSize(s);
							setPage(1);
						}}
					/>
				</>
			)}

			<MockGenerationModal
				open={modalOpen}
				onOpenChange={setModalOpen}
				onGenerated={fetchMocks}
			/>
		</div>
	);
}
