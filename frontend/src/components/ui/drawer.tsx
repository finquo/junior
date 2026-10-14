"use client";

import { cn } from "cn";
import * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";
import { useIsMobile } from "@/hooks/use-mobile";

type DrawerDirection = "top" | "bottom" | "left" | "right";

const DrawerContext = React.createContext<{
	direction: DrawerDirection;
}>({
	direction: "bottom",
});

function useDrawerContext() {
	return React.useContext(DrawerContext);
}

function Drawer({
	direction,
	swipeDirection,
	shouldScaleBackground = true,
	...props
}: React.ComponentProps<typeof DrawerPrimitive.Root> & {
	swipeDirection?: "down" | "up" | "left" | "right";
}) {
	const isMobile = useIsMobile();
	const mappedDirection: DrawerDirection =
		direction ??
		(swipeDirection === "down"
			? "bottom"
			: swipeDirection === "up"
				? "top"
				: swipeDirection) ??
		(isMobile ? "bottom" : "right");

	return (
		<DrawerContext.Provider value={{ direction: mappedDirection }}>
			<DrawerPrimitive.Root
				data-slot="drawer"
				direction={mappedDirection}
				shouldScaleBackground={shouldScaleBackground}
				{...props}
			/>
		</DrawerContext.Provider>
	);
}

function DrawerTrigger({
	...props
}: React.ComponentProps<typeof DrawerPrimitive.Trigger>) {
	return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />;
}

function DrawerPortal({
	...props
}: React.ComponentProps<typeof DrawerPrimitive.Portal>) {
	return <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />;
}

function DrawerClose({
	...props
}: React.ComponentProps<typeof DrawerPrimitive.Close>) {
	return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />;
}

function DrawerOverlay({
	className,
	...props
}: React.ComponentProps<typeof DrawerPrimitive.Overlay>) {
	return (
		<DrawerPrimitive.Overlay
			data-slot="drawer-overlay"
			className={cn(
				"data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/80 data-[state=closed]:animate-out data-[state=open]:animate-in supports-backdrop-filter:backdrop-blur-xs",
				className,
			)}
			{...props}
		/>
	);
}

function DrawerSwipeHandle({
	className,
	style,
	...props
}: React.ComponentProps<typeof DrawerPrimitive.Handle>) {
	const { direction } = useDrawerContext();

	// Right drawer (opens from right screen edge):
	// Handle is placed on opposite side (left edge), vertical orientation (parallel to right opening side)
	if (direction === "right") {
		return (
			<div
				data-slot="drawer-handle-container"
				className="pointer-events-none absolute inset-y-0 left-0 z-50 flex w-4 items-center justify-center"
			>
				<DrawerPrimitive.Handle
					data-slot="drawer-swipe-handle"
					aria-label="Drag to resize or close"
					className={cn(
						"!m-0 !h-14 !w-1 pointer-events-auto cursor-grab rounded-full bg-muted-foreground/20 transition-colors hover:bg-muted-foreground/40 active:cursor-grabbing",
						className,
					)}
					style={{
						height: "3.5rem",
						width: "0.25rem",
						margin: 0,
						...style,
					}}
					{...props}
				/>
			</div>
		);
	}

	// Left drawer (opens from left screen edge):
	// Handle is placed on opposite side (right edge), vertical orientation (parallel to left opening side)
	if (direction === "left") {
		return (
			<div
				data-slot="drawer-handle-container"
				className="pointer-events-none absolute inset-y-0 right-0 z-50 flex w-4 items-center justify-center"
			>
				<DrawerPrimitive.Handle
					data-slot="drawer-swipe-handle"
					aria-label="Drag to resize or close"
					className={cn(
						"!m-0 !h-14 !w-1 pointer-events-auto cursor-grab rounded-full bg-muted-foreground/20 transition-colors hover:bg-muted-foreground/40 active:cursor-grabbing",
						className,
					)}
					style={{
						height: "3.5rem",
						width: "0.25rem",
						margin: 0,
						...style,
					}}
					{...props}
				/>
			</div>
		);
	}

	// Top drawer (opens from top screen edge):
	// Handle is placed on opposite side (bottom edge), horizontal orientation (parallel to top opening side)
	if (direction === "top") {
		return (
			<div
				data-slot="drawer-handle-container"
				className="pointer-events-none order-last flex w-full shrink-0 items-center justify-center pt-1 pb-3"
			>
				<DrawerPrimitive.Handle
					data-slot="drawer-swipe-handle"
					aria-label="Drag to resize or close"
					className={cn(
						"!mx-auto !my-0 !h-1 !w-12 pointer-events-auto cursor-grab rounded-full bg-muted-foreground/20 transition-colors hover:bg-muted-foreground/40 active:cursor-grabbing",
						className,
					)}
					style={{
						height: "0.25rem",
						width: "3rem",
						margin: "0 auto",
						...style,
					}}
					{...props}
				/>
			</div>
		);
	}

	// Bottom drawer (opens from bottom screen edge, default on mobile):
	// Handle is placed on opposite side (top edge), horizontal orientation (parallel to bottom opening side)
	return (
		<div
			data-slot="drawer-handle-container"
			className="pointer-events-none flex w-full shrink-0 items-center justify-center pt-3 pb-1"
		>
			<DrawerPrimitive.Handle
				data-slot="drawer-swipe-handle"
				aria-label="Drag to resize or close"
				className={cn(
					"!mx-auto !my-0 !h-1 !w-12 pointer-events-auto cursor-grab rounded-full bg-muted-foreground/20 transition-colors hover:bg-muted-foreground/40 active:cursor-grabbing",
					className,
				)}
				style={{
					height: "0.25rem",
					width: "3rem",
					margin: "0 auto",
					...style,
				}}
				{...props}
			/>
		</div>
	);
}

const DrawerHandle = DrawerSwipeHandle;

function DrawerContent({
	className,
	children,
	...props
}: React.ComponentProps<typeof DrawerPrimitive.Content>) {
	const { direction } = useDrawerContext();

	return (
		<DrawerPortal data-slot="drawer-portal">
			<DrawerOverlay />
			<DrawerPrimitive.Content
				data-slot="drawer-content"
				className={cn(
					"group/drawer-content fixed z-50 flex h-auto flex-col bg-background text-foreground text-sm",
					"data-[vaul-drawer-direction=top]:inset-x-0 data-[vaul-drawer-direction=top]:top-0 data-[vaul-drawer-direction=top]:mb-24 data-[vaul-drawer-direction=top]:max-h-[80vh] data-[vaul-drawer-direction=top]:rounded-b-lg data-[vaul-drawer-direction=top]:border-b",
					"data-[vaul-drawer-direction=bottom]:inset-x-0 data-[vaul-drawer-direction=bottom]:bottom-0 data-[vaul-drawer-direction=bottom]:mt-24 data-[vaul-drawer-direction=bottom]:max-h-[80vh] data-[vaul-drawer-direction=bottom]:rounded-t-lg data-[vaul-drawer-direction=bottom]:border-t",
					"data-[vaul-drawer-direction=right]:inset-y-0 data-[vaul-drawer-direction=right]:right-0 data-[vaul-drawer-direction=right]:w-3/4 data-[vaul-drawer-direction=right]:border-l data-[vaul-drawer-direction=right]:sm:max-w-sm",
					"data-[vaul-drawer-direction=left]:inset-y-0 data-[vaul-drawer-direction=left]:left-0 data-[vaul-drawer-direction=left]:w-3/4 data-[vaul-drawer-direction=left]:border-r data-[vaul-drawer-direction=left]:sm:max-w-sm",
					"data-[vaul-drawer-direction=right]:pl-2",
					"data-[vaul-drawer-direction=left]:pr-2",
					direction === "right" && "pl-2",
					direction === "left" && "pr-2",
					className,
				)}
				{...props}
			>
				<DrawerHandle />
				{children}
			</DrawerPrimitive.Content>
		</DrawerPortal>
	);
}

function DrawerHeader({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="drawer-header"
			className={cn(
				"flex flex-col gap-0.5 p-4 group-data-[vaul-drawer-direction=bottom]/drawer-content:text-center group-data-[vaul-drawer-direction=top]/drawer-content:text-center md:gap-1.5 md:text-left",
				className,
			)}
			{...props}
		/>
	);
}

function DrawerFooter({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="drawer-footer"
			className={cn("mt-auto flex flex-col gap-2 p-4", className)}
			{...props}
		/>
	);
}

function DrawerInner({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="drawer-inner"
			className={cn("flex flex-1 flex-col overflow-y-auto p-4", className)}
			{...props}
		/>
	);
}

function DrawerTitle({
	className,
	...props
}: React.ComponentProps<typeof DrawerPrimitive.Title>) {
	return (
		<DrawerPrimitive.Title
			data-slot="drawer-title"
			className={cn(
				"font-heading font-medium text-base text-foreground",
				className,
			)}
			{...props}
		/>
	);
}

function DrawerDescription({
	className,
	...props
}: React.ComponentProps<typeof DrawerPrimitive.Description>) {
	return (
		<DrawerPrimitive.Description
			data-slot="drawer-description"
			className={cn("text-muted-foreground text-sm", className)}
			{...props}
		/>
	);
}

export {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHandle,
	DrawerHeader,
	DrawerInner,
	DrawerOverlay,
	DrawerPortal,
	DrawerSwipeHandle,
	DrawerTitle,
	DrawerTrigger,
};
