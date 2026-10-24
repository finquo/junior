"use client";

import { cn } from "cn";
import { Slot } from "radix-ui";
import type { HTMLAttributes, TimeHTMLAttributes } from "react";
import * as React from "react";
import { createContext, useCallback, useContext, useState } from "react";

// Types
type TimelineContextValue = {
	activeStep: number;
	setActiveStep: (step: number) => void;
};

// Context
const TimelineContext = createContext<TimelineContextValue | undefined>(
	undefined,
);

const useTimeline = () => {
	const context = useContext(TimelineContext);
	if (!context) {
		throw new Error("useTimeline must be used within a Timeline");
	}
	return context;
};

// Components
interface TimelineProps extends HTMLAttributes<HTMLDivElement> {
	defaultValue?: number;
	value?: number;
	onValueChange?: (value: number) => void;
	orientation?: "horizontal" | "vertical";
	asChild?: boolean;
}

function Timeline({
	defaultValue = 1,
	value,
	onValueChange,
	orientation = "vertical",
	className,
	children,
	asChild = false,
	...props
}: TimelineProps) {
	const [activeStep, setInternalStep] = useState(defaultValue);

	const setActiveStep = useCallback(
		(step: number) => {
			if (value === undefined) {
				setInternalStep(step);
			}
			onValueChange?.(step);
		},
		[value, onValueChange],
	);

	const currentStep = value ?? activeStep;

	const Comp = asChild ? Slot.Root : "div";

	return (
		<TimelineContext.Provider
			value={{ activeStep: currentStep, setActiveStep }}
		>
			<Comp
				className={cn(
					"group/timeline flex data-[orientation=horizontal]:w-full data-[orientation=horizontal]:flex-row data-[orientation=vertical]:flex-col",
					className,
				)}
				data-orientation={orientation}
				data-slot="timeline"
				{...props}
			>
				{children}
			</Comp>
		</TimelineContext.Provider>
	);
}

// TimelineContent
function TimelineContent({
	className,
	asChild = false,
	children,
	...props
}: HTMLAttributes<HTMLDivElement> & { asChild?: boolean }) {
	const Comp = asChild ? Slot.Root : "div";
	return (
		<Comp
			className={cn("text-muted-foreground text-sm", className)}
			data-slot="timeline-content"
			{...props}
		>
			{children}
		</Comp>
	);
}

interface TimelineDateProps extends TimeHTMLAttributes<HTMLTimeElement> {
	asChild?: boolean;
}

function TimelineDate({
	asChild = false,
	className,
	children,
	...props
}: TimelineDateProps) {
	const Comp = asChild ? Slot.Root : "time";

	return (
		<Comp
			className={cn(
				"mb-1 block font-medium text-muted-foreground text-xs group-data-[orientation=vertical]/timeline:max-sm:h-4",
				className,
			)}
			data-slot="timeline-date"
			{...props}
		>
			{children}
		</Comp>
	);
}

// TimelineHeader
function TimelineHeader({
	className,
	asChild = false,
	children,
	...props
}: HTMLAttributes<HTMLDivElement> & { asChild?: boolean }) {
	const Comp = asChild ? Slot.Root : "div";
	return (
		<Comp
			className={cn(
				"grid auto-rows-min items-start has-data-[slot=timeline-action]:grid-cols-[1fr_auto]",
				className,
			)}
			data-slot="timeline-header"
			{...props}
		>
			{children}
		</Comp>
	);
}

// TimelineAction
function TimelineAction({
	className,
	asChild = false,
	children,
	...props
}: HTMLAttributes<HTMLDivElement> & { asChild?: boolean }) {
	const Comp = asChild ? Slot.Root : "div";
	return (
		<Comp
			className={cn(
				"col-start-2 row-span-2 row-start-1 self-start justify-self-end",
				className,
			)}
			data-slot="timeline-action"
			{...props}
		>
			{children}
		</Comp>
	);
}

// TimelineIndicator
interface TimelineIndicatorProps extends HTMLAttributes<HTMLDivElement> {
	asChild?: boolean;
}

function TimelineIndicator({
	asChild = false,
	className,
	children,
	...props
}: TimelineIndicatorProps) {
	const Comp = asChild ? Slot.Root : "div";

	return (
		<Comp
			aria-hidden="true"
			className={cn(
				"absolute size-4 rounded-full border-2 border-primary/20 group-data-[orientation=horizontal]/timeline:-top-6 group-data-[orientation=vertical]/timeline:top-0 group-data-[orientation=horizontal]/timeline:left-0 group-data-[orientation=vertical]/timeline:-left-6 group-data-[orientation=vertical]/timeline:-translate-x-1/2 group-data-[orientation=horizontal]/timeline:-translate-y-1/2 group-data-completed/timeline-item:border-primary",
				className,
			)}
			data-slot="timeline-indicator"
			{...props}
		>
			{children}
		</Comp>
	);
}

// TimelineItem
interface TimelineItemProps extends HTMLAttributes<HTMLDivElement> {
	step: number;
	asChild?: boolean;
}

function TimelineItem({
	step,
	className,
	asChild = false,
	children,
	...props
}: TimelineItemProps) {
	const { activeStep } = useTimeline();
	const Comp = asChild ? Slot.Root : "div";

	return (
		<Comp
			className={cn(
				"group/timeline-item relative flex flex-1 flex-col gap-0.5 has-[+[data-completed]]:**:data-[slot=timeline-separator]:bg-primary group-data-[orientation=vertical]/timeline:ms-8 group-data-[orientation=horizontal]/timeline:mt-8 group-data-[orientation=horizontal]/timeline:not-last:pe-8 group-data-[orientation=vertical]/timeline:not-last:pb-6",
				className,
			)}
			data-completed={step <= activeStep || undefined}
			data-slot="timeline-item"
			{...props}
		>
			{children}
		</Comp>
	);
}

// TimelineSeparator
function TimelineSeparator({
	className,
	asChild = false,
	children,
	...props
}: HTMLAttributes<HTMLDivElement> & { asChild?: boolean }) {
	const Comp = asChild ? Slot.Root : "div";
	return (
		<Comp
			aria-hidden="true"
			className={cn(
				"absolute self-start bg-primary/10 group-last/timeline-item:hidden group-data-[orientation=horizontal]/timeline:-top-6 group-data-[orientation=vertical]/timeline:-left-6 group-data-[orientation=horizontal]/timeline:h-0.5 group-data-[orientation=vertical]/timeline:h-[calc(100%-1rem-0.25rem)] group-data-[orientation=horizontal]/timeline:w-[calc(100%-1rem-0.25rem)] group-data-[orientation=vertical]/timeline:w-0.5 group-data-[orientation=horizontal]/timeline:translate-x-4.5 group-data-[orientation=vertical]/timeline:-translate-x-1/2 group-data-[orientation=horizontal]/timeline:-translate-y-1/2 group-data-[orientation=vertical]/timeline:translate-y-4.5",
				className,
			)}
			data-slot="timeline-separator"
			{...props}
		>
			{children}
		</Comp>
	);
}

// TimelineTitle
function TimelineTitle({
	className,
	asChild = false,
	children,
	...props
}: HTMLAttributes<HTMLHeadingElement> & { asChild?: boolean }) {
	const Comp = asChild ? Slot.Root : "h3";
	return (
		<Comp
			className={cn("font-medium text-sm", className)}
			data-slot="timeline-title"
			{...props}
		>
			{children}
		</Comp>
	);
}

export {
	Timeline,
	TimelineAction,
	TimelineContent,
	TimelineDate,
	TimelineHeader,
	TimelineIndicator,
	TimelineItem,
	TimelineSeparator,
	TimelineTitle,
};
