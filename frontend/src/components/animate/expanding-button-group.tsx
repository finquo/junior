"use client";

import { cn } from "cn";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import * as React from "react";

type ExpandingButtonGroupItem = {
	id: string;
	label: string;
	icon: React.ReactNode;
	onSelect?: () => void;
	href?: React.ComponentProps<typeof Link>["href"];
	active?: boolean;
	variant?: "default" | "destructive";
	disabled?: boolean;
};

type ExpandingButtonGroupProps = {
	items: ExpandingButtonGroupItem[];
	groupLabel: string;
	className?: string;
	itemClassName?: string;
	expandedId?: string | null;
	onExpandedIdChange?: (id: string | null) => void;
};

const MotionLink = motion.create(Link);

const spring = {
	type: "spring",
	stiffness: 400,
	damping: 30,
	mass: 0.8,
} as const;

function itemTone(item: ExpandingButtonGroupItem, expanded: boolean) {
	if (item.variant === "destructive") {
		if (expanded || item.active) {
			return "bg-destructive text-white";
		}
		return "text-destructive hover:bg-destructive/10";
	}
	if (expanded || item.active) {
		return "bg-primary text-primary-foreground shadow-sm";
	}
	return "text-muted-foreground hover:bg-muted hover:text-foreground";
}

function ItemButton({
	item,
	expanded,
	reduced,
	tabIndex,
	buttonRef,
	onFocusItem,
	onExpand,
	onCollapse,
	onKeyDown,
	className,
}: {
	item: ExpandingButtonGroupItem;
	expanded: boolean;
	reduced: boolean;
	tabIndex: number;
	buttonRef: (node: HTMLButtonElement | HTMLAnchorElement | null) => void;
	onFocusItem: () => void;
	onExpand: () => void;
	onCollapse: () => void;
	onKeyDown: (
		event: React.KeyboardEvent<HTMLButtonElement | HTMLAnchorElement>,
	) => void;
	className?: string;
}) {
	const sharedClassName = cn(
		"relative inline-flex h-10 items-center justify-center overflow-hidden rounded-full px-4 py-3 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
		itemTone(item, expanded),
		className,
	);

	const content = (
		<>
			<span>{item.icon}</span>
			<AnimatePresence initial={false}>
				{expanded ? (
					<motion.span
						initial={
							reduced
								? { opacity: 1 }
								: { opacity: 0, width: 0, filter: "blur(4px)", marginLeft: 0 }
						}
						animate={
							reduced
								? { opacity: 1 }
								: {
										opacity: 1,
										width: "auto",
										filter: "blur(0px)",
										marginLeft: 10,
									}
						}
						exit={
							reduced
								? { opacity: 0 }
								: { opacity: 0, width: 0, filter: "blur(4px)", marginLeft: 0 }
						}
						transition={reduced ? { duration: 0.12 } : spring}
						className="inline-flex items-center overflow-hidden whitespace-nowrap font-medium text-sm"
					>
						{item.label}
					</motion.span>
				) : null}
			</AnimatePresence>
		</>
	);

	const commonProps = {
		ref: buttonRef as React.Ref<HTMLButtonElement & HTMLAnchorElement>,
		className: sharedClassName,
		onMouseEnter: onExpand,
		onMouseLeave: onCollapse,
		onFocus: () => {
			onFocusItem();
			onExpand();
		},
		onBlur: (
			event: React.FocusEvent<HTMLButtonElement | HTMLAnchorElement>,
		) => {
			const next = event.relatedTarget as Node | null;
			if (!next || !event.currentTarget.parentElement?.contains(next)) {
				onCollapse();
			}
		},
		onKeyDown,
		tabIndex,
		"aria-label": item.label,
		"aria-disabled": item.disabled || undefined,
	} as const;

	if (item.href && !item.disabled) {
		return (
			<MotionLink
				layout={!reduced}
				transition={reduced ? { duration: 0 } : spring}
				href={item.href}
				{...commonProps}
				onClick={(event) => {
					if (item.disabled) {
						event.preventDefault();
						return;
					}
					item.onSelect?.();
				}}
			>
				{content}
			</MotionLink>
		);
	}

	return (
		<motion.button
			layout={!reduced}
			transition={reduced ? { duration: 0 } : spring}
			type="button"
			disabled={item.disabled}
			{...commonProps}
			onClick={() => {
				if (item.disabled) {
					return;
				}
				item.onSelect?.();
			}}
		>
			{content}
		</motion.button>
	);
}

export function ExpandingButtonGroup({
	items,
	groupLabel,
	className,
	itemClassName,
	expandedId,
	onExpandedIdChange,
}: ExpandingButtonGroupProps) {
	const reduced = useReducedMotion() ?? false;
	const [uncontrolledExpandedId, setUncontrolledExpandedId] = React.useState<
		string | null
	>(null);
	const [focusIndex, setFocusIndex] = React.useState(0);
	const refs = React.useRef<
		Array<HTMLButtonElement | HTMLAnchorElement | null>
	>([]);

	const isControlled = expandedId !== undefined;
	const currentExpandedId = isControlled ? expandedId : uncontrolledExpandedId;

	const setExpanded = React.useCallback(
		(id: string | null) => {
			if (!isControlled) {
				setUncontrolledExpandedId(id);
			}
			onExpandedIdChange?.(id);
		},
		[isControlled, onExpandedIdChange],
	);

	const enabledIndexes = React.useMemo(
		() =>
			items
				.map((item, index) => ({ item, index }))
				.filter(({ item }) => !item.disabled)
				.map(({ index }) => index),
		[items],
	);

	React.useEffect(() => {
		if (items.length === 0) {
			return;
		}
		if (focusIndex >= items.length) {
			setFocusIndex(Math.max(0, items.length - 1));
			return;
		}
		if (items[focusIndex]?.disabled) {
			const next = enabledIndexes[0] ?? 0;
			setFocusIndex(next);
		}
	}, [enabledIndexes, focusIndex, items]);

	const moveFocus = React.useCallback(
		(nextIndex: number) => {
			if (items.length === 0) {
				return;
			}
			const clamped =
				((nextIndex % items.length) + items.length) % items.length;
			setFocusIndex(clamped);
			refs.current[clamped]?.focus();
		},
		[items.length],
	);

	const onItemKeyDown = React.useCallback(
		(index: number) =>
			(event: React.KeyboardEvent<HTMLButtonElement | HTMLAnchorElement>) => {
				if (items.length === 0) {
					return;
				}
				if (event.key === "ArrowRight") {
					event.preventDefault();
					const next = index + 1;
					for (let i = 0; i < items.length; i += 1) {
						const candidate =
							(((next + i) % items.length) + items.length) % items.length;
						if (!items[candidate]?.disabled) {
							moveFocus(candidate);
							return;
						}
					}
				}
				if (event.key === "ArrowLeft") {
					event.preventDefault();
					const next = index - 1;
					for (let i = 0; i < items.length; i += 1) {
						const candidate =
							(((next - i) % items.length) + items.length) % items.length;
						if (!items[candidate]?.disabled) {
							moveFocus(candidate);
							return;
						}
					}
				}
				if (event.key === "Home") {
					event.preventDefault();
					const first = enabledIndexes[0];
					if (first !== undefined) {
						moveFocus(first);
					}
				}
				if (event.key === "End") {
					event.preventDefault();
					const last = enabledIndexes[enabledIndexes.length - 1];
					if (last !== undefined) {
						moveFocus(last);
					}
				}
			},
		[enabledIndexes, items, moveFocus],
	);

	return (
		<div
			role="toolbar"
			aria-label={groupLabel}
			className={cn(
				"inline-flex items-center gap-1 rounded-full border bg-background/90 p-1 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/70",
				className,
			)}
			onMouseLeave={() => setExpanded(null)}
			onBlur={(event) => {
				const next = event.relatedTarget as Node | null;
				if (!next || !event.currentTarget.contains(next)) {
					setExpanded(null);
				}
			}}
		>
			{items.map((item, index) => {
				const expanded = item.active || currentExpandedId === item.id;
				const tabIndex = index === focusIndex ? 0 : -1;
				return (
					<ItemButton
						key={item.id}
						item={item}
						expanded={expanded}
						reduced={reduced}
						tabIndex={item.disabled ? -1 : tabIndex}
						buttonRef={(node) => {
							refs.current[index] = node;
						}}
						onFocusItem={() => setFocusIndex(index)}
						onExpand={() => {
							if (!item.disabled) {
								setExpanded(item.id);
							}
						}}
						onCollapse={() => {
							if (currentExpandedId === item.id) {
								setExpanded(null);
							}
						}}
						onKeyDown={onItemKeyDown(index)}
						className={itemClassName}
					/>
				);
			})}
		</div>
	);
}
