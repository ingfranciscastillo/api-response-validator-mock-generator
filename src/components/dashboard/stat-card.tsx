import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";

interface StatCardProps {
	title: string;
	value: string | number;
	icon?: React.ReactNode;
	description?: string;
	trend?: { value: number; positive: boolean };
}

export function StatCard({
	title,
	value,
	icon,
	description,
	trend,
}: StatCardProps) {
	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between pb-2">
				<CardTitle className="text-sm font-medium text-muted-foreground">
					{title}
				</CardTitle>
				{icon && <span className="size-4 text-muted-foreground">{icon}</span>}
			</CardHeader>
			<CardContent>
				<div className="text-2xl font-bold">{value}</div>
				{description && (
					<p className="text-xs text-muted-foreground mt-1">{description}</p>
				)}
				{trend && (
					<p
						className={`text-xs mt-1 ${
							trend.positive ? "text-green-600" : "text-red-600"
						}`}
					>
						{trend.positive ? "↑" : "↓"} {trend.value}%
					</p>
				)}
			</CardContent>
		</Card>
	);
}
