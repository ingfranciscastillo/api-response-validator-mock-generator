import type { ReactNode } from "react";
import { cn } from "#/lib/utils.ts";

interface EmptyStateProps {
	icon?: ReactNode;
	title: string;
	description?: string;
	action?: ReactNode;
	className?: string;
}

function EmptyState({
	icon,
	title,
	description,
	action,
	className,
}: EmptyStateProps) {
	return (
		<div
			className={cn(
				"flex flex-col items-center justify-center rounded-lg border border-border bg-surface p-8 text-center",
				className,
			)}
		>
			{icon && <div className="mb-3 text-muted-foreground">{icon}</div>}
			<p className="text-muted-foreground">{title}</p>
			{description && (
				<p className="text-muted-foreground text-sm mt-1">{description}</p>
			)}
			{action && <div className="mt-4">{action}</div>}
		</div>
	);
}

export { EmptyState };
