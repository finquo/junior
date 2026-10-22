"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import Loader from "@/components/loader";
import { useAuth } from "@/hooks/auth";

export default function Layout({ children }: { children: React.ReactNode }) {
	const params = useParams<{ id: string }>();
	const id = params?.id;
	const router = useRouter();
	const { data: user, isPending } = useAuth();

	useEffect(() => {
		if (!isPending && !user) {
			router.replace(`/call/${id}` as "/");
		}
	}, [isPending, user, router, id]);

	if (isPending || !user) return <Loader />;

	return <>{children}</>;
}
