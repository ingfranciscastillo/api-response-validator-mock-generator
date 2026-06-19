import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "#/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import { Textarea } from "#/components/ui/textarea";

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

	return (
		<Dialog
			open={open}
			onOpenChange={(o) => {
				if (!o) onClose();
			}}
		>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Generate Report</DialogTitle>
				</DialogHeader>
				<div className="space-y-4">
					<div className="space-y-2">
						<Label>Report Name</Label>
						<Input
							placeholder="e.g., Weekly Validation Summary"
							value={name}
							onChange={(e) => setName(e.target.value)}
						/>
					</div>
					<div className="space-y-2">
						<Label>Description (optional)</Label>
						<Textarea
							placeholder="Brief description of this report"
							rows={2}
							value={description}
							onChange={(e) => setDescription(e.target.value)}
						/>
					</div>
					<div className="space-y-2">
						<Label>Date Range (days)</Label>
						<Select
							value={String(days)}
							onValueChange={(v) => setDays(Number(v))}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="7">Last 7 days</SelectItem>
								<SelectItem value="14">Last 14 days</SelectItem>
								<SelectItem value="30">Last 30 days</SelectItem>
								<SelectItem value="90">Last 90 days</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>
				<DialogFooter className="pt-2">
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
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
