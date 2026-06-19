import { createFileRoute } from "@tanstack/react-router";
import { Ban, History } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback } from "#/components/ui/avatar";
import { Badge } from "#/components/ui/badge";
import { Card, CardContent } from "#/components/ui/card";
import { EmptyState } from "#/components/ui/empty-state";
import { Input } from "#/components/ui/input";
import { PaginationControls } from "#/components/ui/pagination-controls";
import { Skeleton } from "#/components/ui/skeleton";
import { listAuditLog } from "#/lib/audit/functions";

export const Route = createFileRoute("/dashboard/team/audit-log")({
	head: () => ({
		meta: [
			{
				title: "Audit Log — API Response Validator & Mock Generator",
			},
		],
	}),
	component: AuditLogPage,
});

function AuditLogPage() {
	const { t } = useTranslation();
	const [entries, setEntries] = useState<{
		rows: Array<{
			id: string;
			workspaceId: string;
			actorId: string | null;
			action: string;
			entityType: string | null;
			entityId: string | null;
			metadata: unknown;
			ipAddress: string | null;
			createdAt: Date;
		}>;
		total: number;
		page: number;
		pageSize: number;
		totalPages: number;
	}>({ rows: [], total: 0, page: 1, pageSize: 50, totalPages: 0 });
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [actionFilter, setActionFilter] = useState("");
	const [entityTypeFilter, setEntityTypeFilter] = useState("");
	const [dateFrom, setDateFrom] = useState("");
	const [dateTo, setDateTo] = useState("");
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(50);

	const fetchLogs = () => {
		setLoading(true);
		setError(null);
		listAuditLog({
			data: {
				action: actionFilter || undefined,
				entityType: entityTypeFilter || undefined,
				dateFrom: dateFrom || undefined,
				dateTo: dateTo || undefined,
				page,
				pageSize,
			},
		})
			.then((data) => {
				setEntries(data as typeof entries);
			})
			.catch((e) => {
				setError(e instanceof Error ? e.message : "Failed to load audit log");
			})
			.finally(() => setLoading(false));
	};

	useEffect(() => {
		setPage(1);
	}, [actionFilter, entityTypeFilter, dateFrom, dateTo]);

	useEffect(() => {
		fetchLogs();
	}, [actionFilter, entityTypeFilter, dateFrom, dateTo, page, pageSize]);

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-wrap items-center gap-2">
				<Input
					placeholder={t("dashboard:team.filterAction")}
					className="max-w-xs"
					value={actionFilter}
					onChange={(e) => setActionFilter(e.target.value)}
				/>
				<Input
					placeholder={t("dashboard:team.filterEntityType")}
					className="max-w-xs"
					value={entityTypeFilter}
					onChange={(e) => setEntityTypeFilter(e.target.value)}
				/>
				<Input
					type="date"
					value={dateFrom}
					onChange={(e) => setDateFrom(e.target.value)}
					className="w-[150px]"
					placeholder={t("dashboard:team.fromDate")}
				/>
				<Input
					type="date"
					value={dateTo}
					onChange={(e) => setDateTo(e.target.value)}
					className="w-[150px]"
					placeholder={t("dashboard:team.toDate")}
				/>
			</div>

			{error && (
				<Card>
					<CardContent className="flex items-center gap-3 py-4">
						<Ban className="size-5 text-red-500" />
						<div>
							<p className="text-sm font-medium text-red-600">
								{t("dashboard:team.permissionDenied")}
							</p>
							<p className="text-xs text-muted-foreground mt-0.5">{error}</p>
						</div>
					</CardContent>
				</Card>
			)}

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
			) : error ? null : entries.rows.length === 0 ? (
				<EmptyState
					icon={<History className="size-8" />}
					title={t("dashboard:team.noAuditEvents")}
					description={t("dashboard:team.noAuditEventsDescription")}
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
