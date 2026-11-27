"use client";

import { Video, VideoPlayer } from "@videojs/react/video";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { VideoSkin } from "@/components/videojs/video/skin";
import { getServerBaseUrl } from "@/hooks/url";

export default function Page() {
	const src = getServerBaseUrl("/api/demo/video");

	return (
		<Card>
			<CardHeader>
				<CardTitle>Streaming Demo</CardTitle>
				<CardDescription>
					Public, no-auth stream from course/demo/source/video.mp4.
				</CardDescription>
				<CardAction>
					<Button variant="link" asChild>
						<a href={src} target="_blank" rel="noreferrer">
							Open stream
						</a>
					</Button>
				</CardAction>
			</CardHeader>
			<CardContent>
				<VideoPlayer>
					<VideoSkin className="aspect-video w-full">
						<Video src={src} playsInline preload="metadata" />
					</VideoSkin>
				</VideoPlayer>
			</CardContent>
		</Card>
	);
}
