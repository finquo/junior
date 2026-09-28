export { cn } from "cn";

export function snakeToTitleCase(snake: string): string {
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
