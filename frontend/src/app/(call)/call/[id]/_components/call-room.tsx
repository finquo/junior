"use client";

import dynamic from "next/dynamic";

const VideoChat = dynamic(
	() => import("./video-chat").then((mod) => mod.VideoChat),
	{ ssr: false },
);

export function CallRoom({
	session,
	token,
}: {
	session: string;
	token: string;
}) {
	return <VideoChat session={session} token={token} />;
}
