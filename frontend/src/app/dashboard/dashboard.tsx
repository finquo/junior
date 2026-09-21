"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/hooks/api";
import type { authClient } from "@/lib/auth";

export default function Dashboard(_props: {
	session: typeof authClient.$Infer.Session;
}) {
	const privateData = useQuery(api.privateData.queryOptions());

	return <p>API: {privateData.data?.message}</p>;
}
