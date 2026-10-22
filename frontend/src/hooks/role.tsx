"use client";

import type { Role } from "@/lib/auth";
import { useAuth } from "./auth";

type SwitchType<T extends string | number> = {
	children?: React.ReactNode;
	isPending?: React.ReactNode;
} & {
	[k in T]: React.ReactNode;
};

export function RoleRender({ children, ...options }: SwitchType<Role>) {
	const { data, isPending } = useAuth();

	if (isPending) return options.isPending ?? children;
	if (!data?.role) return children;

	return options[data?.role] ?? children;
}

export function RenderWhenRole({
	role,
	children,
	fallback = null,
}: {
	role: Role | Role[];
	children: React.ReactNode;
	fallback?: React.ReactNode;
}) {
	const { data } = useAuth();

	if (!data?.role) return <>{fallback}</>;

	const roles = Array.isArray(role) ? role : [role];
	if (roles.includes(data.role as Role)) {
		return <>{children}</>;
	}

	return <>{fallback}</>;
}

export function useHasRole(role: Role | Role[]): boolean {
	const { data } = useAuth();
	if (!data?.role) return false;
	const roles = Array.isArray(role) ? role : [role];
	return roles.includes(data.role as Role);
}
