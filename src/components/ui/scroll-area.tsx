import { ScrollArea as ScrollAreaPrimitive } from "radix-ui";
import type * as React from "react";

import { cn } from "#/lib/utils.ts";

function ScrollArea({
	className,
	children,
	...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.Root>) {
	return (
		<ScrollAreaPrimitive.Root
			data-slot="scroll-area"
			className={cn("relative overflow-hidden", className)}
			{...props}
		>
			<ScrollAreaPrimitive.Viewport
				data-slot="scroll-area-viewport"
				className="size-full rounded-[inherit] outline-none"
			>
				{children}
			</ScrollAreaPrimitive.Viewport>
			<ScrollAreaPrimitive.Scrollbar
				data-slot="scroll-area-scrollbar"
				orientation="vertical"
				className="flex touch-none p-px transition-colors select-none hover:bg-border/50 data-[state=hidden]:opacity-0 data-[state=hidden]:duration-300 data-[state=visible]:duration-150"
			>
				<ScrollAreaPrimitive.Thumb
					data-slot="scroll-area-thumb"
					className="relative z-10 flex-1 rounded-full bg-border"
				/>
			</ScrollAreaPrimitive.Scrollbar>
			<ScrollAreaPrimitive.Scrollbar
				data-slot="scroll-area-scrollbar"
				orientation="horizontal"
				className="flex touch-none p-px transition-colors select-none hover:bg-border/50 data-[state=hidden]:opacity-0 data-[state=hidden]:duration-300 data-[state=visible]:duration-150"
			>
				<ScrollAreaPrimitive.Thumb
					data-slot="scroll-area-thumb"
					className="relative z-10 flex-1 rounded-full bg-border"
				/>
			</ScrollAreaPrimitive.Scrollbar>
			<ScrollAreaPrimitive.Corner
				data-slot="scroll-area-corner"
				className="bg-border"
			/>
		</ScrollAreaPrimitive.Root>
	);
}

export { ScrollArea };
