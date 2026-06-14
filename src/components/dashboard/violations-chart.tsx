import {
	Bar,
	BarChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import type { DailyCount } from "#/lib/dashboard/functions";

interface ViolationsChartProps {
	data: DailyCount[];
}

export function ViolationsChart({ data }: ViolationsChartProps) {
	if (data.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="text-sm">Validation Results (14d)</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-muted-foreground">No data yet</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-sm">Validation Results (14d)</CardTitle>
			</CardHeader>
			<CardContent>
				<ResponsiveContainer width="100%" height={250}>
					<BarChart data={data}>
						<CartesianGrid strokeDasharray="3 3" className="stroke-border" />
						<XAxis
							dataKey="date"
							tick={{ fontSize: 11 }}
							tickFormatter={(v: string) => v.slice(5)}
							className="text-muted-foreground"
						/>
						<YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
						<Tooltip />
						<Bar
							dataKey="pass"
							fill="hsl(142.1 76.2% 36.3%)"
							name="Pass"
							stackId="a"
						/>
						<Bar
							dataKey="warning"
							fill="hsl(47.9 95.8% 53.1%)"
							name="Warning"
							stackId="a"
						/>
						<Bar
							dataKey="fail"
							fill="hsl(0 72.2% 50.6%)"
							name="Fail"
							stackId="a"
						/>
					</BarChart>
				</ResponsiveContainer>
			</CardContent>
		</Card>
	);
}
