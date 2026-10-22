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
	onEnd,
}: {
	session: string;
	token: string;
	slotId?: string;
	onEnd?: () => void;
}) {
	return (
		<VideoChat session={session} token={token} slotId={slotId} onEnd={onEnd} />
	);
}
