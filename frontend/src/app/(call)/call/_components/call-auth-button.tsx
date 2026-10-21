"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/auth";

export function CallAuthButton() {
	const { data, isPending } = useAuth();

	if (isPending) {
		return null;
	}

	if (!data) {
		return (
			<Button asChild variant="outline">
				<Link href="/login">Login</Link>
			</Button>
		);
	}

	return (
		<Button asChild variant="outline">
			<Link href="/me">Go to my profile</Link>
		</Button>
	);
}
