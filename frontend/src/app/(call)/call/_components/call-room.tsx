"use client";

import dynamic from "next/dynamic";

const VideoChat = dynamic(
	() => import("./video-chat").then((mod) => mod.VideoChat),
	{ ssr: false },
);

export function CallRoom({
	session,
	token,
	slotId,
	userName,
	canViewDetails,
	canEndMeeting,
	disableVideo,
	disableAudio,
	onLeave,
	onEnd,
}: {
	session: string;
	token: string;
	slotId?: string;
	userName: string;
	canViewDetails: boolean;
	canEndMeeting: boolean;
	disableVideo: boolean;
	disableAudio: boolean;
	onLeave: () => void;
	onEnd?: () => void;
}) {
	return (
		<VideoChat
			session={session}
			token={token}
			slotId={slotId}
			userName={userName}
			canViewDetails={canViewDetails}
			canEndMeeting={canEndMeeting}
			disableVideo={disableVideo}
			disableAudio={disableAudio}
			onLeave={onLeave}
			onEnd={onEnd}
		/>
	);
}
