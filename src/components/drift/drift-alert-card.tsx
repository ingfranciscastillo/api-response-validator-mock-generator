import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader } from "#/components/ui/card";

interface DriftAlert {
	id: string;
	specId: string;
	type: string;
	severity: string;
	summary: string;
	status: string;
	detectedAt: Date;
}

interface DriftAlertCardProps {
	alert: DriftAlert;
	onResolve?: (id: string) => void;
}

export function DriftAlertCard({ alert, onResolve }: DriftAlertCardProps) {
	const severityColor: Record<string, string> = {
		low: "bg-gray-100 text-gray-700",
		medium: "bg-yellow-100 text-yellow-700",
		high: "bg-orange-100 text-orange-700",
		critical: "bg-red-100 text-red-700",
	};

	return (
		<Card
			className={alert.status === "open" ? "border-l-4 border-l-red-500" : ""}
		>
			<CardHeader className="flex flex-row items-center justify-between pb-2">
				<div className="flex items-center gap-2">
					{alert.status === "open" ? (
						<AlertCircle className="size-4 text-red-500" />
					) : (
						<CheckCircle2 className="size-4 text-green-500" />
					)}
					<Badge className={severityColor[alert.severity] ?? ""}>
						{alert.severity}
					</Badge>
					<Badge variant="outline">{alert.type}</Badge>
				</div>
				{alert.status === "open" && onResolve && (
					<Button variant="ghost" size="xs" onClick={() => onResolve(alert.id)}>
						Resolve
					</Button>
				)}
			</CardHeader>
			<CardContent>
				<p className="text-sm">{alert.summary}</p>
				<p className="text-xs text-muted-foreground mt-1">
					{new Date(alert.detectedAt).toLocaleString()}
				</p>
			</CardContent>
		</Card>
	);
}
