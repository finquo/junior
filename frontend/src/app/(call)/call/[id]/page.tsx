"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Script from "next/script";
import Loader from "@/components/loader";
import { api } from "@/hooks/api";
import { CallNotice } from "../_components/call-notice";
import { CallRoom } from "../_components/call-room";

function Call({ id }: { id: string }) {
	const { data, isPending, isError, error } = useQuery({
		...api.meeting.join.queryOptions({ input: { id } }),
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
	});

	console.log(error);

	if (isPending) return <Loader />;

	if (isError || !data) return <CallNotice status="error" />;

	if (data.status === "live") {
		return <CallRoom session={id} token={data.token} />;
	}

	return <CallNotice status={data.status} />;
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
