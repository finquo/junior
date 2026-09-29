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

export const findFallback = (name: string): string => {
	const x = name.replace(/[^\p{L}\s]/gu, "").split(/\s+/);
	let y = "";
	if (x.length > 1)
		x.forEach((i) => {
			y += i[0];
		});
	else y = x[0];
	return y.slice(0, 3);
};

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
