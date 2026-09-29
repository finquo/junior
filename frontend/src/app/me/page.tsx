"use client";

import { RedirectType, redirect } from "next/navigation";
import { useAuth } from "@/hooks/auth";

export default function () {
	const { data, isPending } = useAuth();

	if (isPending) return null;

	if (data?.role) {
		redirect(`/${data.role}` as "/me", RedirectType.replace);
	}

	return redirect("/login", RedirectType.replace);
}
