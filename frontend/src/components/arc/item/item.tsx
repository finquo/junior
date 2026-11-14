"use client";

import type { HTMLAttributes } from "react";
import styles from "./item.module.css";

/**
 * Arc-styled list row, exposed as the compound Item/ItemMedia/ItemContent/ItemTitle/
 * ItemDescription/ItemActions/ItemGroup/ItemSeparator API the app composes with.
 * All styling lives in item.module.css; these are layout-only shells.
 */

function cx(...names: Array<string | false | null | undefined>) {
	return names.filter(Boolean).join(" ");
}

export interface ItemProps extends HTMLAttributes<HTMLDivElement> {
	variant?: "default" | "secondary" | "outline" | "muted";
	size?: "default" | "sm" | "xs";
}

export function Item({
	variant = "default",
	size = "default",
	className,
	...props
}: ItemProps) {
	return (
		<div
			data-size={size}
			className={cx(
				styles.item,
				styles[variant],
				size !== "default" && styles[size],
				className,
			)}
			{...props}
		/>
	);
}

export function ItemGroup({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
	return <div role="list" {...props} className={cx(styles.group, className)} />;
}

export function ItemSeparator({
	className,
	...props
}: HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			role="separator"
			{...props}
			className={cx(styles.separator, className)}
		/>
	);
}

export interface ItemMediaProps extends HTMLAttributes<HTMLDivElement> {
	variant?: "default" | "icon" | "image";
}

export function ItemMedia({
	variant = "default",
	className,
	...props
}: ItemMediaProps) {
	return (
		<div
			className={cx(
				styles.media,
				variant !== "default" && styles[variant],
				className,
			)}
			{...props}
		/>
	);
}

export function ItemContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
	return <div {...props} className={cx(styles.content, className)} />;
}

export function ItemTitle({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
	return <div {...props} className={cx(styles.title, className)} />;
}

export function ItemDescription({
	className,
	...props
}: HTMLAttributes<HTMLParagraphElement>) {
	return <p {...props} className={cx(styles.description, className)} />;
}

export function ItemActions({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
	return <div {...props} className={cx(styles.actions, className)} />;
}
