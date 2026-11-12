"use client";

import { cn } from "cn";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { Accordion as AccordionPrimitive } from "radix-ui";
import type * as React from "react";

function Accordion({
	className,
	...props
}: React.ComponentProps<typeof AccordionPrimitive.Root>) {
	return (
		<AccordionPrimitive.Root
			data-slot="accordion"
			className={cn(
				"flex w-full flex-col overflow-hidden rounded-2xl border",
				className,
			)}
			{...props}
		/>
	);
}

function AccordionItem({
	className,
	...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
	return (
		<AccordionPrimitive.Item
			data-slot="accordion-item"
			className={cn("not-last:border-b data-open:bg-muted/50", className)}
			{...props}
		/>
	);
}

function AccordionTrigger({
	className,
	children,
	secondary,
	...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger> & {
	secondary?: React.ReactNode;
}) {
	return (
		<AccordionPrimitive.Header className="flex">
			<AccordionPrimitive.Trigger
				data-slot="accordion-trigger"
				className={cn(
					"group/accordion-trigger relative flex flex-1 items-start gap-2 border border-transparent p-4 text-left font-medium text-sm outline-none transition-all disabled:pointer-events-none disabled:opacity-50 **:data-[slot=accordion-trigger-icon]:ml-auto **:data-[slot=accordion-trigger-icon]:size-4 **:data-[slot=accordion-trigger-icon]:text-muted-foreground",
					className,
				)}
				{...props}
			>
				<div>
					<ChevronDownIcon
						data-slot="accordion-trigger-icon"
						className="pointer-events-none shrink-0 group-aria-expanded/accordion-trigger:hidden"
					/>
					<ChevronUpIcon
						data-slot="accordion-trigger-icon"
						className="pointer-events-none hidden shrink-0 group-aria-expanded/accordion-trigger:inline"
					/>
				</div>
				{children}
			</AccordionPrimitive.Trigger>
			{secondary && (
				<div className="flex items-center p-4 pl-0">{secondary}</div>
			)}
		</AccordionPrimitive.Header>
	);
}

function AccordionContent({
	className,
	children,
	...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
	return (
		<AccordionPrimitive.Content
			data-slot="accordion-content"
			className="overflow-hidden px-4 text-sm data-closed:animate-accordion-up data-open:animate-accordion-down"
			{...props}
		>
			<div
				className={cn(
					"h-(--radix-accordion-content-height) pt-0 pb-4 [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground [&_p:not(:last-child)]:mb-4",
					className,
				)}
			>
				{children}
			</div>
		</AccordionPrimitive.Content>
	);
}

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger };
