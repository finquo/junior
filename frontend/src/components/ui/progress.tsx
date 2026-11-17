"use client";

import { Progress as ProgressPrimitive } from "@animate-ui/react/primitives/radix-ui";
import { cn } from "cn";
import type * as React from "react";

function Progress({
	className,
	value,
	...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
	return (
		<ProgressPrimitive.Root
			data-slot="progress"
			className={cn(
				"relative flex h-2 w-full items-center overflow-x-hidden rounded-2xl bg-muted",
				className,
			)}
			{...props}
		>
			<ProgressPrimitive.Indicator
				data-slot="progress-indicator"
				className="size-full flex-1 bg-primary"
				style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
			/>
		</ProgressPrimitive.Root>
	);
}

export { Progress };
