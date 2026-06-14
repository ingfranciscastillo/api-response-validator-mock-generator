import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { Badge } from "#/components/ui/badge";
import { Card, CardContent, CardHeader } from "#/components/ui/card";
import type { mockDataset } from "#/db/schema";

type MockRow = typeof mockDataset.$inferSelect;

const variantColors: Record<string, string> = {
	generated: "bg-blue-500",
	edge_case: "bg-amber-500",
	manual: "bg-purple-500",
};

const methodColors: Record<string, string> = {
	GET: "bg-green-600",
	POST: "bg-blue-600",
	PUT: "bg-orange-600",
	PATCH: "bg-amber-600",
	DELETE: "bg-red-600",
	HEAD: "bg-purple-600",
	OPTIONS: "bg-slate-600",
};

function extractMethod(name: string): string | null {
	const match = name.match(/^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)/);
	return match ? match[1] : null;
}

function extractPath(name: string): string {
	const parts = name.split(" — ");
	if (parts.length >= 2) {
		const second = parts[1] ?? "";
		const spaceIdx = second.indexOf(" ");
		return spaceIdx > 0 ? second : second;
	}
	const method = extractMethod(name);
	if (method) {
		return name.slice(method.length).trim();
	}
	return name;
}

interface MockCardProps {
	mock: MockRow;
}

export function MockCard({ mock }: MockCardProps) {
	const method = extractMethod(mock.name);
	const path = extractPath(mock.name);

	return (
		<Link
			to="/dashboard/mocks/$mockId"
			params={{ mockId: mock.id }}
			className="block"
		>
			<Card className="transition-colors hover:bg-muted/50 cursor-pointer">
				<CardHeader className="flex flex-row items-center justify-between">
					<div className="flex items-center gap-2">
						{method && (
							<Badge
								className={`${methodColors[method]} text-white hover:${methodColors[method]}`}
							>
								{method}
							</Badge>
						)}
						<span className="font-mono text-sm text-muted-foreground truncate max-w-[300px]">
							{path || mock.name}
						</span>
					</div>
					<div className="flex items-center gap-2">
						<Badge
							variant="secondary"
							className={variantColors[mock.variantType]}
						>
							{mock.variantType.replace("_", " ")}
						</Badge>
						<Badge variant="outline">{mock.statusCode}</Badge>
						<ChevronRight className="size-4 text-muted-foreground" />
					</div>
				</CardHeader>
				<CardContent>
					<div className="flex items-center justify-between text-sm">
						{mock.variantLabel && (
							<span className="text-muted-foreground">{mock.variantLabel}</span>
						)}
						<span className="text-muted-foreground">
							{new Date(mock.createdAt).toLocaleDateString()}
						</span>
					</div>
				</CardContent>
			</Card>
		</Link>
	);
}
