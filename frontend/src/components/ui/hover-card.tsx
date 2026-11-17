"use client";

import { HoverCard as HoverCardPrimitive } from "@animate-ui/react/primitives/radix-ui";
import { cn } from "cn";
import type * as React from "react";

function HoverCard({
	...props
}: React.ComponentProps<typeof HoverCardPrimitive.Root>) {
	return <HoverCardPrimitive.Root data-slot="hover-card" {...props} />;
}

function HoverCardTrigger({
	...props
}: React.ComponentProps<typeof HoverCardPrimitive.Trigger>) {
	return (
		<HoverCardPrimitive.Trigger data-slot="hover-card-trigger" {...props} />
	);
}

function HoverCardContent({
	className,
	align = "center",
	sideOffset = 4,
	...props
}: React.ComponentProps<typeof HoverCardPrimitive.Content>) {
	return (
		<HoverCardPrimitive.Portal data-slot="hover-card-portal">
			<HoverCardPrimitive.Content
				data-slot="hover-card-content"
				align={align}
				sideOffset={sideOffset}
				className={cn(
					"z-50 w-72 origin-(--radix-hover-card-content-transform-origin) rounded-3xl bg-popover p-4 text-popover-foreground text-sm shadow-lg outline-hidden ring-1 ring-foreground/5 dark:ring-foreground/10",
					className,
				)}
				{...props}
			/>
		</HoverCardPrimitive.Portal>
	);
}

export { HoverCard, HoverCardContent, HoverCardTrigger };
