"use client";

import { HlsJsVideo } from "@videojs/react/media/hlsjs-video";
import { Video, VideoPlayer } from "@videojs/react/video";
import { getCourseVideoFileUrl } from "backend/config";
import { useParams } from "next/navigation";
import { VideoSkin } from "@/components/videojs/video/skin";
import { LoadQuery } from "@/hooks/load";
import { getServerBaseUrl } from "@/hooks/url";

const SOURCE_PATH = "source/video.mp4";
const MANIFEST_PATH = "hls/master.m3u8";

export default function Page() {
	const videoId = useParams<{ id: string }>().id;
	const manifestPath = getCourseVideoFileUrl(videoId, MANIFEST_PATH);
	const sourcePath = getCourseVideoFileUrl(videoId, SOURCE_PATH);
	const manifestUrl = getServerBaseUrl(manifestPath ?? "");
	const sourceUrl = getServerBaseUrl(sourcePath ?? "");

	return (
		<LoadQuery
			label="Course video"
			api={{
				queryKey: ["course-video-hls", videoId] as const,
				queryFn: async () => {
					const response = await fetch(manifestUrl, { method: "HEAD" });
					return response.ok;
				},
				staleTime: Number.POSITIVE_INFINITY,
				refetchOnWindowFocus: false,
			}}
		>
			{(hasHls) => (
				<VideoPlayer>
					<VideoSkin className="aspect-video w-full">
						{hasHls ? (
							<HlsJsVideo
								src={manifestUrl}
								playsInline
								preload="metadata"
								crossOrigin="anonymous"
							/>
						) : (
							<Video src={sourceUrl} playsInline preload="metadata" />
						)}
					</VideoSkin>
				</VideoPlayer>
			)}
		</LoadQuery>
	);
}
