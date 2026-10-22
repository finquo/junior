import dynamic from "next/dynamic";

export const VideoChat = dynamic(
	() => import("./video-chat").then((mod) => mod.VideoChat),
	{ ssr: false },
);
