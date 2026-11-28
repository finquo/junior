"use client";

import { Suspense } from "react";
import {
	Frame,
	FrameDescription,
	FrameHeader,
	FramePanel,
	FrameTitle,
} from "@/components/reui/frame";
import { Skeleton } from "@/components/ui/skeleton";
import { VideoCreateForm } from "../_components/video-create";

export default function Page() {
	return (
		<Frame>
			<FrameHeader>
				<FrameTitle>Create Video</FrameTitle>
				<FrameDescription>
					Add video metadata and upload its MP4 source file
				</FrameDescription>
			</FrameHeader>
			<FramePanel>
				<Suspense fallback={<Skeleton className="h-96 w-full" />}>
					<VideoCreateForm />
				</Suspense>
			</FramePanel>
		</Frame>
	);
}
