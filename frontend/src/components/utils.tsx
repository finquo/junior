import type { ReactNode } from "react";

type SwitchType<T extends string | number> = {
	cases: T;
	children?: ReactNode;
} & {
	[k in T]: ReactNode;
};

export function SwitchNode<T extends string | number>({
	cases,
	children,
	...options
}: SwitchType<T>) {
	return options[cases as keyof typeof options] ?? children;
}

export function RenderNothing({
	children,
	fallback,
	container,
}: {
	container: (c: ReactNode) => ReactNode | null;
	fallback?: ReactNode;
	children?: ReactNode | null;
}) {
	if (!children) {
		if (fallback) return fallback;
		return null;
	}
	return container(children);
}
