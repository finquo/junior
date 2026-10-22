"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Container } from "@/components/container";
import Loader from "@/components/loader";
import { api } from "@/hooks/api";
import { useAuth } from "@/hooks/auth";
import { getCallName } from "../../_components/call-name";
import { CallNotice } from "../../_components/call-notice";
import { useJoinPreferences } from "../../_components/call-preferences";
import { CallRoom } from "../../_components/call-room";

function Joined({ id }: { id: string }) {
	const router = useRouter();
	const { data: user, isPending: authPending } = useAuth();
	const { camera, mic } = useJoinPreferences();

	const join = useQuery({
		...api.core.slot.join.queryOptions({ input: { id } }),
		enabled: Boolean(user),
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
	});

	useEffect(() => {
		if (!authPending && !user) {
			router.replace(`/call/${id}` as "/");
		}
	}, [authPending, user, router, id]);

	if (authPending || !user) return <Loader />;

	const { data, isPending, isError, error, refetch } = join;

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

	const userName = user.name?.trim() || getCallName(id) || "User";
	const canEndMeeting = ["admin", "scheduler", "teacher"].includes(user.role);

	return (
		<CallRoom
			session={data.session}
			token={data.token}
			slotId={id}
			userName={userName}
			canViewDetails
			canEndMeeting={canEndMeeting}
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

	return <Joined id={id} />;
}
