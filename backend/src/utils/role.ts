import type { Role } from "@/auth";

export function MapRole<T, R extends Role>(role: R, options: Record<R, T>) {
	return options[role] as NonNullable<T>;
}
