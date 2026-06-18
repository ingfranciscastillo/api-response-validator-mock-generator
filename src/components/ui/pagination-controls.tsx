import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "#/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";

interface PaginationControlsProps {
	page: number;
	totalPages: number;
	total: number;
	pageSize: number;
	onPageChange: (page: number) => void;
	onPageSizeChange?: (pageSize: number) => void;
}

function PaginationControls({
	page,
	totalPages,
	total,
	pageSize,
	onPageChange,
	onPageSizeChange,
}: PaginationControlsProps) {
	const { t } = useTranslation();
	return (
		<div className="flex items-center justify-between pt-2">
			<p className="text-sm text-text-secondary">
				{t("common:resultCount", { count: total })}
			</p>
			<div className="flex items-center gap-2">
				{onPageSizeChange && (
					<Select
						value={String(pageSize)}
						onValueChange={(v) => onPageSizeChange(Number(v))}
					>
						<SelectTrigger className="w-20 h-8 text-xs">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="10">10</SelectItem>
							<SelectItem value="25">25</SelectItem>
							<SelectItem value="50">50</SelectItem>
							<SelectItem value="100">100</SelectItem>
						</SelectContent>
					</Select>
				)}
				<Button
					variant="outline"
					size="icon-xs"
					disabled={page <= 1}
					onClick={() => onPageChange(page - 1)}
				>
					<ChevronLeft className="size-4" />
				</Button>
				<span className="text-sm text-text-secondary tabular-nums min-w-[4rem] text-center">
					{t("dashboard:pagination.pageInfo", { current: page, total: totalPages })}
				</span>
				<Button
					variant="outline"
					size="icon-xs"
					disabled={page >= totalPages}
					onClick={() => onPageChange(page + 1)}
				>
					<ChevronRight className="size-4" />
				</Button>
			</div>
		</div>
	);
}

export { PaginationControls };
