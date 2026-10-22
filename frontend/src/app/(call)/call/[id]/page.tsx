"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import Script from "next/script";
import Loader from "@/components/loader";
import { api } from "@/hooks/api";
import { useAuth } from "@/hooks/auth";
import { CallNotice } from "../_components/call-notice";
import { CallRoom } from "../_components/call-room";

function Call({ id }: { id: string }) {
	const router = useRouter();
	const { data: user, isPending: isAuthPending } = useAuth();

	const memberJoin = useQuery(
		api.core.slot.join.queryOptions({
			input: { id },
			enabled: Boolean(user),
			refetchOnWindowFocus: false,
			refetchOnReconnect: false,
		}),
	);

	const guestJoin = useQuery(
		api.meeting.join.queryOptions({
			input: { id },
			enabled: !isAuthPending && !user,
			refetchOnWindowFocus: false,
			refetchOnReconnect: false,
		}),
	);

	if (isAuthPending) return <Loader />;

	const { data, isPending, isError, error, refetch } = user
		? memberJoin
		: guestJoin;

	if (isPending) return <Loader />;

	if (isError || !data) {
		return <CallNotice status="error" error={error} onRefresh={refetch} />;
	}

	if (data.status === "live") {
		return (
			<CallRoom
				session={id}
				token={data.token}
				slotId={id}
				onEnd={() => router.push(`/call/${id}/ended` as "/")}
			/>
		);
	}

	return <CallNotice status={data.status} onRefresh={refetch} />;
}

export default function Page() {
	const params = useParams<{ id: string }>();
	const id = params?.id;

	return (
		<>
			<Script src="/coi-serviceworker.js" />
			{id ? <Call id={id} /> : <CallNotice status="not_found" />}
		</>
	);
}
