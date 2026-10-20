"use client";

import { useQuery } from "@tanstack/react-query";
import Script from "next/script";
import Loader from "@/components/loader";
import { api } from "@/hooks/api";
import { CallNotice } from "../_components/call-notice";
import { CallRoom } from "../_components/call-room";

function Demo() {
	const { data, isPending, isError } = useQuery({
		...api.meeting.demo.queryOptions(),
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
	});

	if (isPending) return <Loader />;

	if (isError || !data) return <CallNotice status="error" />;

	return <CallRoom session={data.session} token={data.token} />;
}

export default function Page() {
	return (
		<>
			<Script src="/coi-serviceworker.js" />
			<Demo />
		</>
	);
}
