"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { Container } from "@/components/container";
import Loader from "@/components/loader";
import { api } from "@/hooks/api";
import { getCallName } from "../../_components/call-name";
import { CallNotice } from "../../_components/call-notice";
import { useJoinPreferences } from "../../_components/call-preferences";
import { VideoChat } from "../../_components/zoom";

function Guest({ id }: { id: string }) {
	const router = useRouter();
	const { camera, mic } = useJoinPreferences();

	const { data, isPending, isError, error, refetch } = useQuery(
		api.meeting.join.queryOptions({
			input: { id },
			refetchOnWindowFocus: false,
			refetchOnReconnect: false,
		}),
	);

	if (isPending) return <Loader />;

	if (isError || !data) {
		return (
			<Container>
				<CallNotice status="error" error={error} onRefresh={refetch} />
			</Container>
		);
	}

	if (data.status !== "live") {
		return (
			<Container>
				<CallNotice status={data.status} onRefresh={refetch} />
			</Container>
		);
	}

	const userName = getCallName(id) || "Guest";

	return (
		<VideoChat
			session={data.session}
			token={data.token}
			userName={userName}
			canViewDetails={false}
			canEndMeeting={false}
			canRecord={false}
			autoRecord={false}
			disableVideo={!camera}
			disableAudio={!mic}
			onLeave={() => router.push(`/call/${id}/left` as "/")}
			onEnd={() => router.push(`/call/${id}/ended` as "/")}
		/>
	);
}

export default function Page() {
	const params = useParams<{ id: string }>();
	const id = params?.id;

	if (!id) return <Loader />;

	return <Guest id={id} />;
}
