import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import type * as React from "react";

function BubbleGroup({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="bubble-group"
			className={cn("flex min-w-0 flex-col gap-2", className)}
			{...props}
		/>
	);
}

const bubbleVariants = cva(
	"group/bubble relative flex w-fit min-w-5 max-w-[80%] flex-col gap-1 overflow-hidden rounded-md border border-transparent p-2 data-[variant=ghost]:max-w-full data-[align=end]:self-end group-data-[align=end]/message:self-end",
	{
		variants: {
			variant: {
				default: "bg-primary text-primary-foreground",
				secondary: "bg-secondary text-secondary-foreground",
				muted: "bg-muted",
				tinted:
					"bg-[oklch(from_var(--primary)_0.93_calc(c*0.4)_h)] text-foreground dark:bg-[oklch(from_var(--primary)_0.3_calc(c*0.4)_h)]",
				outline: "border-border bg-background",
				ghost: "rounded-none border-none bg-transparent p-0",
				destructive:
					"bg-destructive/10 text-destructive dark:bg-destructive/20",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
);

function Bubble({
	variant = "default",
	align = "start",
	className,
	...props
}: React.ComponentProps<"div"> &
	VariantProps<typeof bubbleVariants> & {
		align?: "start" | "end";
	}) {
	return (
		<div
			data-slot="bubble"
			data-variant={variant}
			data-align={align}
			className={cn(bubbleVariants({ variant }), className)}
			{...props}
		/>
	);
}

function BubbleContent({
	className,
	children,
	...props
}: React.ComponentProps<"div">) {
	const isBlock = typeof children !== "string" && children != null;

	return (
		<div
			data-slot="bubble-content"
			className={cn("wrap-break-word text-sm leading-relaxed", className)}
			{...props}
		>
			{isBlock ? (
				<div className="mt-1 w-full rounded-sm bg-muted p-2 text-foreground">
					{children}
				</div>
			) : (
				<div className="px-2">{children}</div>
			)}
		</div>
	);
}

function BubbleHeader({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="bubble-header"
			className={cn("flex items-center gap-1 pr-1", className)}
			{...props}
		/>
	);
}

const bubbleReactionsVariants = cva(
	"absolute z-10 flex w-fit shrink-0 items-center justify-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-sm ring-3 ring-card has-[button]:p-0",
	{
		variants: {
			side: {
				top: "top-0 -translate-y-3/4",
				bottom: "bottom-0 translate-y-3/4",
			},
			align: {
				start: "left-3",
				end: "right-3",
			},
		},
		defaultVariants: {
			side: "bottom",
			align: "end",
		},
	},
);

function BubbleReactions({
	side = "bottom",
	align = "end",
	className,
	...props
}: React.ComponentProps<"div"> & {
	align?: "start" | "end";
	side?: "top" | "bottom";
}) {
	return (
		<div
			data-slot="bubble-reactions"
			data-align={align}
			data-side={side}
			className={cn(bubbleReactionsVariants({ side, align }), className)}
			{...props}
		/>
	);
}

export { Bubble, BubbleContent, BubbleGroup, BubbleHeader, BubbleReactions };
