import { createFileRoute } from "@tanstack/react-router";
import { History } from "lucide-react";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "#/components/ui/avatar";
import { Badge } from "#/components/ui/badge";
import { Card, CardContent } from "#/components/ui/card";
import { EmptyState } from "#/components/ui/empty-state";
import { Input } from "#/components/ui/input";
import { PaginationControls } from "#/components/ui/pagination-controls";
import { Skeleton } from "#/components/ui/skeleton";
import { listAuditLog } from "#/lib/audit/functions";

export const Route = createFileRoute("/dashboard/team/audit-log")({
	component: AuditLogPage,
});

function AuditLogPage() {
	const [entries, setEntries] = useState<
		Awaited<ReturnType<typeof listAuditLog>>
	>({ rows: [], total: 0, page: 1, pageSize: 50, totalPages: 0 });
	const [loading, setLoading] = useState(true);
	const [actionFilter, setActionFilter] = useState("");
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(50);

	const fetchLogs = () => {
		setLoading(true);
		listAuditLog({
			data: {
				action: actionFilter || undefined,
				page,
				pageSize,
			},
		})
			.then(setEntries)
			.finally(() => setLoading(false));
	};

	useEffect(() => {
		setPage(1);
	}, [actionFilter]);

	useEffect(() => {
		fetchLogs();
	}, [actionFilter, page, pageSize]);

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center gap-3">
				<Input
					placeholder="Filter by action..."
					className="max-w-xs"
					value={actionFilter}
					onChange={(e) => setActionFilter(e.target.value)}
				/>
			</div>

			{loading ? (
				<div className="space-y-2">
					{Array.from({ length: 5 }).map((_, i) => (
						<Card key={i}>
							<CardContent className="flex items-center gap-3 py-3">
								<Skeleton className="size-8 rounded-full" />
								<div className="flex-1 space-y-2">
									<Skeleton className="h-4 w-32" />
									<Skeleton className="h-3 w-48" />
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			) : entries.rows.length === 0 ? (
				<EmptyState
					icon={<History className="size-8" />}
					title="No audit log entries"
					description="Actions performed by team members will appear here"
				/>
			) : (
				<>
					<div className="space-y-2">
						{entries.rows.map((entry) => (
							<Card key={entry.id}>
								<CardContent className="flex items-center gap-3 py-3">
									<Avatar size="sm">
										<AvatarFallback>
											{entry.actorId?.charAt(0).toUpperCase() ?? "S"}
										</AvatarFallback>
									</Avatar>
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2">
											<Badge variant="outline" className="font-mono text-xs">
												{entry.action}
											</Badge>
											{entry.entityType && (
												<span className="text-xs text-text-tertiary">
													{entry.entityType}
													{entry.entityId && ` #${entry.entityId.slice(0, 8)}`}
												</span>
											)}
										</div>
										<p className="text-xs text-text-tertiary mt-0.5">
											{new Date(entry.createdAt).toLocaleString()}
										</p>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
					<PaginationControls
						page={entries.page}
						totalPages={entries.totalPages}
						total={entries.total}
						pageSize={pageSize}
						onPageChange={setPage}
						onPageSizeChange={(s) => {
							setPageSize(s);
							setPage(1);
						}}
					/>
				</>
			)}
		</div>
	);
}
