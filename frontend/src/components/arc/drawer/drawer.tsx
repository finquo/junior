"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { PanInfo, Transition } from "motion/react";
import {
	AnimatePresence,
	animate,
	motion,
	useMotionValue,
	useReducedMotion,
} from "motion/react";
import type {
	ComponentPropsWithoutRef,
	CSSProperties,
	ReactNode,
	RefObject,
} from "react";
import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useRef,
	useState,
} from "react";
import { motionTokens } from "../lib/motion-tokens";
import styles from "./drawer.module.css";

/**
 * The last item a drawer showed. Pass the selected item (or null when nothing is open) and render the drawer's content
 * from the result, so the content stays on screen while the panel slides out instead of vanishing the moment it closes.
 */
export function useDrawerItem<T>(
	item: T | null | undefined,
): T | null | undefined {
	const [last, setLast] = useState(item);
	if (item != null && item !== last) setLast(item);
	return item ?? last;
}

/** Mirrors the open state so the panel can stay mounted while it slides out, retarget mid-flight, and close itself after a drag. */
const DrawerContext = createContext<{
	open: boolean;
	flung: boolean;
	setOpen: (open: boolean) => void;
	fling: () => void;
	openedAt: RefObject<number>;
} | null>(null);

export function Drawer({
	open: openProp,
	defaultOpen = false,
	onOpenChange,
	...props
}: ComponentPropsWithoutRef<typeof DialogPrimitive.Root>) {
	const [uncontrolled, setUncontrolled] = useState(defaultOpen);
	// A drag that dismisses the panel hands its velocity to the exit spring; every other close uses the shorter tween.
	const [flung, setFlung] = useState(false);
	// When the drawer last opened, so a click that reopens it mid-close is not also read as a click outside the leaving panel.
	const openedAt = useRef(0);
	const open = openProp ?? uncontrolled;
	const setOpen = useCallback(
		(next: boolean) => {
			setFlung(false);
			if (next) openedAt.current = performance.now();
			if (openProp === undefined) setUncontrolled(next);
			onOpenChange?.(next);
		},
		[openProp, onOpenChange],
	);
	const fling = useCallback(() => {
		setOpen(false);
		setFlung(true);
	}, [setOpen]);
	const value = useMemo(
		() => ({ open, flung, setOpen, fling, openedAt }),
		[open, flung, setOpen, fling],
	);
	return (
		<DrawerContext.Provider value={value}>
			<DialogPrimitive.Root {...props} open={open} onOpenChange={setOpen} />
		</DrawerContext.Provider>
	);
}

export const DrawerTrigger = DialogPrimitive.Trigger;
export const DrawerClose = DialogPrimitive.Close;

/** App's action row inside the drawer body; left-aligned with the shared gap, like shadcn's stacked footer but in one row. */
export function DrawerFooter({
	className,
	...props
}: ComponentPropsWithoutRef<"div">) {
	return (
		<div
			{...props}
			className={[styles.footer, className].filter(Boolean).join(" ")}
		/>
	);
}

/** Scrollable middle region of a drawer: pair it with a DrawerFooter so long content scrolls inside while the header and footer stay pinned. */
export function DrawerInner({
	className,
	...props
}: ComponentPropsWithoutRef<"div">) {
	return (
		<div
			{...props}
			className={[styles.inner, className].filter(Boolean).join(" ")}
		/>
	);
}

export interface DrawerContentProps
	extends ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
	title: string;
	description?: string;
	children: ReactNode;
	side?: "left" | "right" | "top" | "bottom";
	/** Renders the drawer inside this element instead of the page body, anchored to its edges. The element needs position: relative and overflow: hidden. */
	container?: HTMLElement | null;
	/** Layout class for the padded body, when the content needs its own stacking rhythm. */
	bodyClassName?: string;
}

const fade: Transition = { duration: motionTokens.duration.instant };
/* A click or Escape returns the panel quickly; a flick keeps its velocity in a spring of the same length. The shadow fades over the last stretch so it leaves with the panel instead of popping away at unmount. */
const shadowOut: Transition = {
	duration: motionTokens.duration.standard,
	times: [0, 0.65, 1],
	ease: "linear",
};
const leave: Transition = {
	default: {
		duration: motionTokens.duration.standard,
		ease: [...motionTokens.ease.standard],
	},
	opacity: shadowOut,
};
const flingOut: Transition = {
	default: {
		...motionTokens.spring.smooth,
		visualDuration: motionTokens.duration.standard,
	},
	opacity: shadowOut,
};

/** When the title or description changes while open, the new copy rises in and the old copy leaves upward. */
function SwapText({ text }: { text: string }) {
	const reduced = useReducedMotion();
	return (
		<AnimatePresence mode="popLayout" initial={false}>
			<motion.span
				key={text}
				className={styles.swap}
				initial={
					reduced
						? false
						: {
								opacity: 0,
								y: "0.3em",
								filter: `blur(${motionTokens.blur.soft}px)`,
							}
				}
				animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
				exit={
					reduced
						? { opacity: 0, transition: { duration: 0 } }
						: {
								opacity: 0,
								y: "-0.3em",
								filter: `blur(${motionTokens.blur.subtle}px)`,
								transition: {
									duration: motionTokens.duration.fast,
									ease: [...motionTokens.ease.standard],
								},
							}
				}
				transition={{
					duration: motionTokens.duration.standard,
					ease: [...motionTokens.ease.enter],
				}}
			>
				{text}
			</motion.span>
		</AnimatePresence>
	);
}

export function DrawerContent({
	title,
	description,
	children,
	side = "right",
	container,
	bodyClassName,
	className,
	onInteractOutside,
	style,
	...props
}: DrawerContentProps) {
	const drawer = useContext(DrawerContext);
	const reduced = useReducedMotion();
	const panelRef = useRef<HTMLDivElement>(null);
	const offset = useMotionValue<number | string>(0);
	const pan = useRef<number | null>(null);
	const axis = side === "left" || side === "right" ? "x" : "y";
	const sign = side === "right" || side === "bottom" ? 1 : -1;
	const offscreen = { [axis]: `${sign * 100}%` };
	const classes = [styles.content, className].filter(Boolean).join(" ");
	const draggable = drawer !== null && !reduced;

	/* Bottom panels behave like a vaul sheet with snap points: they rest at their natural height (the caller's
	   style height when given, otherwise the content) and dragging the handle up expands them toward nearly
	   full screen; dragging down collapses them back and keeps going into the dismiss. Left/right/top keep
	   their fixed-edge layout and only drag to dismiss. */
	const callerStyle = style as CSSProperties | undefined;
	const bottomHeight =
		side === "bottom"
			? ((callerStyle?.height as string | number) ?? "auto")
			: null;
	const height = useMotionValue<string | number>(bottomHeight ?? "auto");
	const expanded = useRef(false);
	const resize = useRef(false);
	const panHeight = useRef(0);
	const naturalHeight = useRef(0);
	const expandable = side === "bottom" && draggable;

	/* Expanded sheets stop just short of the viewport so the page behind stays peeking. */
	const maxHeight = () => Math.round(window.innerHeight * 0.92);

	const panelSize = () =>
		(axis === "x"
			? panelRef.current?.offsetWidth
			: panelRef.current?.offsetHeight) ?? 480;

	// The header is the grab handle. It follows the pointer toward the edge and rubber-bands the other way.
	function panStart(event: PointerEvent) {
		const target = event.target instanceof Element ? event.target : null;
		if (
			!draggable ||
			target?.closest("button, a, input, select, textarea, [role='button']")
		)
			return;
		// The entrance animates in percent of the panel, so a grab mid-flight converts it to pixels.
		const value = offset.get();
		pan.current =
			typeof value === "number"
				? value
				: (Number.parseFloat(value) / 100) * panelSize();
		offset.stop();
		resize.current = false;
		const current = panelRef.current?.offsetHeight ?? 0;
		panHeight.current = current;
		if (!expanded.current) naturalHeight.current = current;
	}
	function panMove(_: PointerEvent, info: PanInfo) {
		if (pan.current === null) return;
		const toward = (pan.current + info.offset[axis]) * sign;
		if (!expandable) {
			offset.set(sign * (toward >= 0 ? toward : -Math.sqrt(-toward)));
			return;
		}
		// Downward from the resting height slides the sheet toward its edge; a clear upward pull switches the
		// same gesture into resizing the sheet instead.
		if (!resize.current) {
			if (toward >= 0) {
				offset.set(toward >= 0 ? toward : -Math.sqrt(-toward));
				return;
			}
			if (toward > -8) return;
			resize.current = true;
		}
		// Resizing: up grows the sheet (rubber-banding past full), down shrinks it; once it reaches its
		// natural height, the leftover distance keeps pulling the panel toward dismissal.
		const max = maxHeight();
		const natural = naturalHeight.current || panHeight.current;
		let next = panHeight.current - info.offset.y;
		let shift = 0;
		if (next < natural) {
			shift = natural - next;
			next = natural;
		} else if (next > max) {
			next = max + Math.sqrt(next - max);
		}
		height.set(next);
		offset.set(shift);
	}
	// Past a third of the panel, or on a quick flick toward the edge, the drawer closes and keeps its velocity; otherwise it springs back.
	function panEnd(_: PointerEvent, info: PanInfo) {
		if (pan.current === null) return;
		pan.current = null;
		const toward = Number(offset.get()) * sign;
		const flick = info.velocity[axis] * sign;
		if (resize.current) {
			resize.current = false;
			const natural = naturalHeight.current || panHeight.current;
			const max = maxHeight();
			const grown = Number(height.get()) - natural;
			// Snap: a long pull down (or a downward flick) dismisses; a long pull up (or an upward flick)
			// expands to full; anything smaller returns to the resting height.
			if (toward > natural * 0.3 || (flick > 500 && toward > 0)) {
				drawer?.fling();
				return;
			}
			if (grown > (max - natural) * 0.25 || (grown > 0 && flick < -500)) {
				expanded.current = true;
				animate(height, max, motionTokens.spring.smooth);
			} else {
				expanded.current = false;
				animate(height, natural, {
					...motionTokens.spring.snappy,
					onComplete: () => {
						if (!expanded.current && bottomHeight !== null)
							height.set(bottomHeight);
					},
				});
			}
			animate(offset, 0, motionTokens.spring.snappy);
			return;
		}
		if (
			toward > panelSize() / 3 ||
			(toward > 0 && info.velocity[axis] * sign > 500)
		)
			drawer?.fling();
		else animate(offset, 0, motionTokens.spring.snappy);
	}

	const inner = (
		<>
			<motion.div
				className={[styles.header, draggable ? styles.handle : ""]
					.filter(Boolean)
					.join(" ")}
				onPanStart={panStart}
				onPan={panMove}
				onPanEnd={panEnd}
			>
				<div>
					<DialogPrimitive.Title className={styles.title}>
						<SwapText text={title} />
					</DialogPrimitive.Title>
					{description ? (
						<DialogPrimitive.Description className={styles.description}>
							<SwapText text={description} />
						</DialogPrimitive.Description>
					) : null}
				</div>
				<DialogPrimitive.Close
					className={styles.close}
					aria-label="Close drawer"
				>
					<X size={16} strokeWidth={1.75} aria-hidden="true" />
				</DialogPrimitive.Close>
			</motion.div>
			<div className={[styles.body, bodyClassName].filter(Boolean).join(" ")}>
				{children}
			</div>
		</>
	);

	// Under a bare Radix root the open state is unknown here, so CSS keyframes keyed off data-state animate the layers instead.
	if (drawer === null) {
		return (
			<DialogPrimitive.Portal container={container}>
				<DialogPrimitive.Overlay
					className={`${styles.overlay} ${styles.keyframes}`}
					data-contained={container ? "" : undefined}
				/>
				<DialogPrimitive.Content
					{...props}
					style={callerStyle}
					onInteractOutside={onInteractOutside}
					data-side={side}
					data-contained={container ? "" : undefined}
					className={`${classes} ${styles.keyframes}`}
				>
					{inner}
				</DialogPrimitive.Content>
			</DialogPrimitive.Portal>
		);
	}

	// The panel springs fully opaque from its own edge and returns to it faster than it arrived, from wherever it is.
	return (
		<AnimatePresence custom={drawer.flung}>
			{drawer.open && (
				<DialogPrimitive.Portal key="drawer" forceMount container={container}>
					<DialogPrimitive.Overlay asChild forceMount>
						<motion.div
							className={styles.overlay}
							data-contained={container ? "" : undefined}
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{
								opacity: 0,
								transition: reduced
									? fade
									: {
											duration: motionTokens.duration.fast,
											ease: [...motionTokens.ease.standard],
										},
							}}
							transition={
								reduced
									? fade
									: {
											duration: motionTokens.duration.standard,
											ease: [...motionTokens.ease.enter],
										}
							}
						/>
					</DialogPrimitive.Overlay>
					<DialogPrimitive.Content
						{...props}
						asChild
						forceMount
						// Radix reads a click outside on click, so the press that reopens a closing drawer would dismiss it again.
						onInteractOutside={(event) => {
							onInteractOutside?.(event);
							if (
								event.detail.originalEvent.timeStamp < drawer.openedAt.current
							)
								event.preventDefault();
						}}
					>
						<motion.div
							ref={panelRef}
							className={classes}
							data-side={side}
							data-contained={container ? "" : undefined}
							style={{
								[axis]: offset,
								...(bottomHeight !== null ? { height } : {}),
								...(side !== "bottom" ? callerStyle : {}),
							}}
							variants={{
								exit: (flung: boolean) =>
									reduced
										? { opacity: 0, transition: fade }
										: {
												...offscreen,
												opacity: [1, 1, 0],
												transition: flung ? flingOut : leave,
											},
							}}
							initial={reduced ? { opacity: 0 } : { ...offscreen, opacity: 1 }}
							animate={reduced ? { opacity: 1 } : { [axis]: 0, opacity: 1 }}
							exit="exit"
							transition={reduced ? fade : motionTokens.spring.smooth}
						>
							{inner}
						</motion.div>
					</DialogPrimitive.Content>
				</DialogPrimitive.Portal>
			)}
		</AnimatePresence>
	);
}

export default Drawer;
