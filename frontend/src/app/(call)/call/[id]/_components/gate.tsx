"use client";

import Loader from "@/components/loader";
import { Frame, FramePanel } from "@/components/reui/frame";
import { useAuth } from "@/hooks/auth";
import { CallNotice } from "../../_components/call-notice";
import { useJoinPreferences } from "../../_components/call-preferences";
import { useCallPreview } from "./call-preview";
import { useGuestName, usePreflight } from "./hooks";
import { CallJoinCard } from "./join-card";

export function CallGate({ id }: { id: string }) {
	const {
		data: user,
		isPending,
		checked: higherRole,
	} = useAuth((u) =>
		u?.role ? ["admin", "scheduler", "teacher"].includes(u.role) : false,
	);
	const preferences = useJoinPreferences();
	const preview = useCallPreview();
	const guestName = useGuestName(id);
	const preflight = usePreflight(id, Boolean(user));

	if (isPending) return <Loader />;

	if (preflight.isPending) return <Loader />;

	if (preflight.isError || !preflight.meeting) {
		return (
			<Frame className="h-full min-h-0 rounded-none">
				<FramePanel className="grid h-full min-h-0 place-items-center overflow-hidden">
					<CallNotice
						status="error"
						error={preflight.error}
						onRefresh={preflight.refetch}
					/>
				</FramePanel>
			</Frame>
		);
	}

	const meeting = preflight.meeting;

	if (meeting.status === "not_found" || meeting.status === "ended") {
		return <CallNotice status={meeting.status} onRefresh={preflight.refetch} />;
	}

	return (
		<CallJoinCard
			meeting={meeting}
			user={user}
			higherRole={Boolean(higherRole)}
			preferences={preferences}
			preview={preview}
			guestName={guestName}
			preflight={preflight}
			id={id}
		/>
	);
}
