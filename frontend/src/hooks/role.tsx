"use client";

import type { Role } from "@/lib/auth";
import { useAuth } from "./auth";

type SwitchType<T extends string | number> = {
	children?: React.ReactNode;
} & {
	[k in T]: React.ReactNode;
};

export function RoleRender({ children, ...options }: SwitchType<Role>) {
	const { data } = useAuth();

	if (!data?.role) return children;

	return options[data?.role] ?? children;
}
