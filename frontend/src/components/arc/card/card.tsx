"use client";

import type { ComponentPropsWithoutRef, HTMLAttributes } from "react";
import { motion, useReducedMotion } from "motion/react";
import { motionTokens } from "../lib/motion-tokens";
import styles from "./card.module.css";

/**
 * Arc's card surface (border, radius, shadow, hover lift, typography) exposed as
 * the compound Card/CardHeader/CardTitle/CardDescription/CardAction/CardContent/CardFooter
 * API the app composes with. All styling lives in card.module.css; these are layout-only shells.
 */

function cx(...names: Array<string | false | null | undefined>) {
	return names.filter(Boolean).join(" ");
}

export function Card({
	className,
	children,
	...props
}: Omit<HTMLAttributes<HTMLElement>, "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart">) {
	const reduced = useReducedMotion() ?? false;
	return (
		<motion.article
			{...(props as ComponentPropsWithoutRef<typeof motion.article>)}
			className={cx(styles.card, className)}
			data-hover="true"
			whileHover={reduced ? undefined : { y: -2 }}
			transition={{ default: motionTokens.spring.snappy }}
		>
			<div className={styles.content}>{children}</div>
		</motion.article>
	);
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
	return <div {...props} className={cx(styles.header, className)} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
	return <h3 {...props} className={cx(styles.title, className)} />;
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
	return <p {...props} className={cx(styles.description, className)} />;
}

export function CardAction({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
	return <div {...props} className={cx(styles.action, className)} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
	return <div {...props} className={cx(styles.section, className)} />;
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
	return <div {...props} className={cx(styles.footer, className)} />;
}
