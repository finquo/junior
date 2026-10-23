"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import Loader from "@/components/loader";
import { useCallAuth } from "@/hooks/call";

export default function Layout({ children }: { children: React.ReactNode }) {
	const id = useParams<{ id: string }>().id;
	const router = useRouter();
	const { data: user, isPending } = useCallAuth();

	useEffect(() => {
		if (!isPending && !user) {
			router.replace(`/call/${id}` as "/");
		}
	}, [isPending, user, router, id]);

	if (isPending || !user) return <Loader />;

	return <>{children}</>;
}
