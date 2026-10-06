import type { StandardSchemaV1 } from "@tanstack/react-form";
import type { infer as Infer, ZodObject, z } from "zod";

export { cn } from "cn";

export function snakeToTitleCase(snake?: string | null) {
	if (!snake) return snake;

	return snake
		.split("_")
		.filter(Boolean)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join(" ");
}

type StrictTuple<T, U extends T[]> = [T] extends [U[number]]
	? U[number] extends T
		? U
		: never
	: never;

export const createStrictArray =
	<T>() =>
	<U extends T[]>(...elements: StrictTuple<T, U>) =>
		elements;

export function formatDate(
	date: Date | string | number | null | undefined,
): string {
	if (!date) return "—";
	const d =
		typeof date === "string" || typeof date === "number"
			? new Date(date)
			: date;
	return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}

export function getInitials(name?: string | null): string {
	if (!name) return "U";
	return name
		.trim()
		.split(/\s+/)
		.map((n) => n[0])
		.filter(Boolean)
		.slice(0, 2)
		.join("")
		.toUpperCase();
}

function hashString(value: string): number {
	let hash = 0;

	for (let i = 0; i < value.length; i++) {
		hash = (hash * 31 + value.charCodeAt(i)) | 0;
	}

	return hash >>> 0;
}

export function selectDeterministically<
	const T extends readonly [string, ...string[]],
>(choices: T, input: string): T[number] {
	const index = hashString(input) % choices.length;
	return choices[index] ?? choices[0];
}

export function chunkArray<T>(arr: T[], size: number): T[][] {
	const result: T[][] = [];

	if (size <= 0) return result;

	for (let i = 0; i < arr.length; i += size) {
		result.push(arr.slice(i, i + size));
	}
	return result;
}

export type GetFormZod<T extends ZodObject> = StandardSchemaV1<
	Infer<T>,
	unknown
>;
