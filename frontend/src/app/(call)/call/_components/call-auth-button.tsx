"use client";

import { useRouter } from "next/navigation";
import { Button as ArcButton } from "@/components/arc/button/button";
import { useAuth } from "@/hooks/auth";

export function CallAuthButton() {
	const router = useRouter();
	const { data, isPending } = useAuth();

	if (isPending) {
		return null;
	}

	if (!data) {
		return (
			<ArcButton variant="secondary" onClick={() => router.push("/login")}>
				Login
			</ArcButton>
		);
	}

	return (
		<ArcButton variant="secondary" onClick={() => router.push("/me")}>
			Go to my profile
		</ArcButton>
	);
}
