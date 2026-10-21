"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Script from "next/script";
import Loader from "@/components/loader";
import { api } from "@/hooks/api";
import { CallNotice } from "../_components/call-notice";
import { CallRoom } from "../_components/call-room";

function Call({ id }: { id: string }) {
	const { data, isPending, isError, error, refetch } = useQuery(
		api.meeting.join.queryOptions({
			input: { id },
			refetchOnWindowFocus: false,
			refetchOnReconnect: false,
		}),
	);

	if (isPending) return <Loader />;

	if (isError || !data) {
		return <CallNotice status="error" error={error} onRefresh={refetch} />;
	}

	if (data.status === "live") {
		return <CallRoom session={id} token={data.token} />;
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
