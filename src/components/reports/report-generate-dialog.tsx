import { Plus, X } from "lucide-react";
import { useState } from "react";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";

interface ReportGenerateDialogProps {
	open: boolean;
	onClose: () => void;
	onGenerate: (data: {
		name: string;
		description?: string;
		days: number;
	}) => void;
	generating: boolean;
}

export function ReportGenerateDialog({
	open,
	onClose,
	onGenerate,
	generating,
}: ReportGenerateDialogProps) {
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [days, setDays] = useState(30);

	if (!open) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
			<Card className="w-full max-w-md">
				<CardHeader className="flex flex-row items-center justify-between pb-2">
					<CardTitle className="text-lg">Generate Report</CardTitle>
					<Button variant="ghost" size="icon-xs" onClick={onClose}>
						<X className="size-4" />
					</Button>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-1">
						<label className="text-sm font-medium">Report Name</label>
						<input
							className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
							placeholder="e.g., Weekly Validation Summary"
							value={name}
							onChange={(e) => setName(e.target.value)}
						/>
					</div>
					<div className="space-y-1">
						<label className="text-sm font-medium">
							Description (optional)
						</label>
						<textarea
							className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
							placeholder="Brief description of this report"
							rows={2}
							value={description}
							onChange={(e) => setDescription(e.target.value)}
						/>
					</div>
					<div className="space-y-1">
						<label className="text-sm font-medium">Date Range (days)</label>
						<select
							className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
							value={days}
							onChange={(e) => setDays(Number(e.target.value))}
						>
							<option value={7}>Last 7 days</option>
							<option value={14}>Last 14 days</option>
							<option value={30}>Last 30 days</option>
							<option value={90}>Last 90 days</option>
						</select>
					</div>
					<div className="flex justify-end gap-2 pt-2">
						<Button variant="outline" onClick={onClose} disabled={generating}>
							Cancel
						</Button>
						<Button
							disabled={!name || generating}
							onClick={() => {
								onGenerate({
									name,
									description: description || undefined,
									days,
								});
								setName("");
								setDescription("");
							}}
						>
							<Plus className="size-4" />
							{generating ? "Generating..." : "Generate"}
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
