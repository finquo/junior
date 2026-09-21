"use client";

import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/hooks/orpc";
import type { authClient } from "@/lib/auth-client";

export default function Dashboard(_props: {
	session: typeof authClient.$Infer.Session;
}) {
	const privateData = useQuery(orpc.privateData.queryOptions());

	return <p>API: {privateData.data?.message}</p>;
}
