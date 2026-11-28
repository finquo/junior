"use client";

import { HlsJsVideo } from "@videojs/react/media/hlsjs-video";
import { Video, VideoPlayer } from "@videojs/react/video";
import { getCourseVideoFileUrl } from "backend/config";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { VideoSkin } from "@/components/videojs/video/skin";
import { api } from "@/hooks/api";
import { LoadQuery } from "@/hooks/load";
import { getServerBaseUrl } from "@/hooks/url";

const DEMO_VIDEO_ID = "demo";
const SOURCE_PATH = "source/video.mp4";
const MANIFEST_PATH = "hls/master.m3u8";

function DemoPlayer() {
	return (
		<LoadQuery
			label="Course video files"
			api={{
				...api.stream.files.queryOptions({
					input: { videoId: DEMO_VIDEO_ID },
				}),
				staleTime: Number.POSITIVE_INFINITY,
				refetchOnWindowFocus: false,
			}}
		>
			{(files) => {
				const hasHls = files.some((file) => file.path === MANIFEST_PATH);
				const manifestPath = getCourseVideoFileUrl(
					DEMO_VIDEO_ID,
					MANIFEST_PATH,
				);
				const sourcePath = getCourseVideoFileUrl(DEMO_VIDEO_ID, SOURCE_PATH);
				const sourceSrc = getServerBaseUrl(sourcePath ?? "");
				const description = hasHls
					? "HLS is ready. Pick a resolution in the player settings."
					: "Playing the source video. HLS quality selection appears after conversion.";
				const player =
					hasHls && manifestPath ? (
						<HlsJsVideo
							src={getServerBaseUrl(manifestPath)}
							playsInline
							preload="metadata"
							crossOrigin="anonymous"
						/>
					) : (
						<Video src={sourceSrc} playsInline preload="metadata" />
					);
				const footer =
					hasHls && manifestPath ? (
						<CardFooter className="justify-end">
							<Button variant="link" asChild>
								<a
									href={getServerBaseUrl(manifestPath)}
									target="_blank"
									rel="noreferrer"
								>
									Open manifest
								</a>
							</Button>
						</CardFooter>
					) : null;

				return (
					<Card>
						<CardHeader>
							<CardTitle>Streaming Demo</CardTitle>
							<CardDescription>{description}</CardDescription>
						</CardHeader>
						<CardContent>
							<VideoPlayer>
								<VideoSkin className="aspect-video w-full">{player}</VideoSkin>
							</VideoPlayer>
						</CardContent>
						{footer}
					</Card>
				);
			}}
		</LoadQuery>
	);
}

export default function Page() {
	return <DemoPlayer />;
}
