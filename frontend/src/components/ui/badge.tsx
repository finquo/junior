import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import { selectDeterministically } from "@/lib/utils";

const badgeVariants = cva(
	"group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap rounded-4xl border border-transparent px-2 py-0.5 font-medium text-xs transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
	{
		variants: {
			variant: {
				default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
				secondary:
					"bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
				destructive:
					"bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20",
				outline:
					"border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
				ghost:
					"hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
				link: "text-primary underline-offset-4 hover:underline",
				success:
					"bg-emerald-500/15 text-emerald-700 focus-visible:ring-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400 [a]:hover:bg-emerald-500/25",
				warning:
					"bg-amber-500/15 text-amber-700 focus-visible:ring-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400 [a]:hover:bg-amber-500/25",
				info: "bg-sky-500/15 text-sky-700 focus-visible:ring-sky-500/20 dark:bg-sky-500/20 dark:text-sky-400 [a]:hover:bg-sky-500/25",
				blue: "bg-blue-500/15 text-blue-700 focus-visible:ring-blue-500/20 dark:bg-blue-500/20 dark:text-blue-400 [a]:hover:bg-blue-500/25",
				cyan: "bg-cyan-500/15 text-cyan-700 focus-visible:ring-cyan-500/20 dark:bg-cyan-500/20 dark:text-cyan-400 [a]:hover:bg-cyan-500/25",
				teal: "bg-teal-500/15 text-teal-700 focus-visible:ring-teal-500/20 dark:bg-teal-500/20 dark:text-teal-400 [a]:hover:bg-teal-500/25",
				green:
					"bg-green-500/15 text-green-700 focus-visible:ring-green-500/20 dark:bg-green-500/20 dark:text-green-400 [a]:hover:bg-green-500/25",
				yellow:
					"bg-yellow-500/15 text-yellow-800 focus-visible:ring-yellow-500/20 dark:bg-yellow-500/20 dark:text-yellow-300 [a]:hover:bg-yellow-500/25",
				orange:
					"bg-orange-500/15 text-orange-700 focus-visible:ring-orange-500/20 dark:bg-orange-500/20 dark:text-orange-400 [a]:hover:bg-orange-500/25",
				purple:
					"bg-purple-500/15 text-purple-700 focus-visible:ring-purple-500/20 dark:bg-purple-500/20 dark:text-purple-400 [a]:hover:bg-purple-500/25",
				violet:
					"bg-violet-500/15 text-violet-700 focus-visible:ring-violet-500/20 dark:bg-violet-500/20 dark:text-violet-400 [a]:hover:bg-violet-500/25",
				indigo:
					"bg-indigo-500/15 text-indigo-700 focus-visible:ring-indigo-500/20 dark:bg-indigo-500/20 dark:text-indigo-400 [a]:hover:bg-indigo-500/25",
				pink: "bg-pink-500/15 text-pink-700 focus-visible:ring-pink-500/20 dark:bg-pink-500/20 dark:text-pink-400 [a]:hover:bg-pink-500/25",
				rose: "bg-rose-500/15 text-rose-700 focus-visible:ring-rose-500/20 dark:bg-rose-500/20 dark:text-rose-400 [a]:hover:bg-rose-500/25",
				red: "bg-red-500/15 text-red-700 focus-visible:ring-red-500/20 dark:bg-red-500/20 dark:text-red-400 [a]:hover:bg-red-500/25",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
);

function Badge({
	className,
	variant = "default",
	render,
	...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
	return useRender({
		defaultTagName: "span",
		props: mergeProps<"span">(
			{
				className: cn(badgeVariants({ variant }), className),
			},
			props,
		),
		render,
		state: {
			slot: "badge",
			variant,
		},
	});
}

const choices = [
	"default",
	"secondary",
	"success",
	"warning",
	"info",
	"blue",
	"cyan",
	"teal",
	"green",
	"yellow",
	"orange",
	"purple",
	"violet",
	"indigo",
	"pink",
	"rose",
	"red",
] as const;

function ColorBadge({
	className,
	variant,
	render,
	...props
}: Omit<useRender.ComponentProps<"span">, "children"> &
	VariantProps<typeof badgeVariants> & {
		children?: string | null | undefined;
	}) {
	if (!props.children) return null;

	const staticVarient = !variant
		? selectDeterministically(choices, props.children)
		: variant;
	return useRender({
		defaultTagName: "span",
		props: mergeProps<"span">(
			{
				className: cn(badgeVariants({ variant: staticVarient }), className),
			},
			props,
		),
		render,
		state: {
			slot: "badge",
			variant,
		},
	});
}

export { Badge, badgeVariants, ColorBadge };
