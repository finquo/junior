"use client";

import { RedirectType, redirect } from "next/navigation";
import { useAuth } from "@/hooks/auth";

export default function Layout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const { data, isPending } = useAuth();

	if (isPending) return children;

	if (data?.role) {
		return redirect("/me", RedirectType.replace);
	}

	return children;
}
