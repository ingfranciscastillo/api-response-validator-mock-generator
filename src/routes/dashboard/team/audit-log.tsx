import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "#/components/ui/avatar";
import { Badge } from "#/components/ui/badge";
import { Card, CardContent } from "#/components/ui/card";
import { Input } from "#/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
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

	const fetchLogs = () => {
		setLoading(true);
		listAuditLog({
			data: {
				action: actionFilter || undefined,
				page: 1,
				pageSize: 50,
			},
		})
			.then(setEntries)
			.finally(() => setLoading(false));
	};

	useEffect(() => {
		fetchLogs();
	}, [actionFilter]);

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center gap-3">
				<Input
					placeholder="Filter by action..."
					className="max-w-xs"
					value={actionFilter}
					onChange={(e) => setActionFilter(e.target.value)}
				/>
				<p className="text-sm text-text-secondary">
					{entries.total} event{entries.total !== 1 ? "s" : ""}
				</p>
			</div>

			{loading ? (
				<div className="flex items-center justify-center py-12">
					<div className="size-8 animate-pulse rounded-full bg-muted" />
				</div>
			) : entries.rows.length === 0 ? (
				<div className="rounded-lg border border-border bg-surface p-8 text-center">
					<p className="text-text-tertiary">No audit log entries</p>
				</div>
			) : (
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
			)}
		</div>
	);
}
