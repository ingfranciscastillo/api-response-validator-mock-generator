import { Link } from "@tanstack/react-router";
import { FileText, Trash2 } from "lucide-react";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";

interface ReportCardProps {
	id: string;
	name: string;
	description: string | null;
	type: string;
	status: string;
	createdAt: string;
	onDelete?: (id: string) => void;
}

export function ReportCard({
	id,
	name,
	description,
	type,
	status,
	createdAt,
	onDelete,
}: ReportCardProps) {
	return (
		<Link to="/dashboard/reports/$reportId" params={{ reportId: id }}>
			<Card className="transition-colors hover:bg-muted/50">
				<CardHeader className="flex flex-row items-start justify-between pb-2">
					<div className="flex items-center gap-2">
						<FileText className="mt-0.5 size-4 text-muted-foreground" />
						<div>
							<CardTitle className="text-sm font-medium">{name}</CardTitle>
							{description && (
								<p className="text-xs text-muted-foreground mt-0.5">
									{description}
								</p>
							)}
						</div>
					</div>
					<Badge variant={status === "ready" ? "default" : "secondary"}>
						{status}
					</Badge>
				</CardHeader>
				<CardContent>
					<div className="flex items-center justify-between text-xs text-muted-foreground">
						<div className="flex items-center gap-2">
							<Badge variant="outline" className="text-[10px]">
								{type}
							</Badge>
						</div>
						<div className="flex items-center gap-2">
							<span>{new Date(createdAt).toLocaleDateString()}</span>
							<Button
								variant="ghost"
								size="icon-xs"
								onClick={(e) => {
									e.preventDefault();
									onDelete?.(id);
								}}
							>
								<Trash2 className="size-3" />
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>
		</Link>
	);
}
