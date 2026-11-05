"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useState } from "react";
import Loader from "@/components/loader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { api } from "@/hooks/api";
import { MediaPipeline } from "./_components/pipeline";

function SessionMedia({ slotId }: { slotId: string }) {
	const [index, setIndex] = useState(0);

	const {
		data: slot,
		isPending: isSlotPending,
		isError: isSlotError,
	} = useQuery(
		api.core.slot.get.queryOptions({
			input: { id: slotId },
		}),
	);

	const { data: files = [] } = useQuery(
		api.media.library.files.queryOptions({
			input: { id: slotId },
		}),
	);

	const {
		data: media,
		isPending: isMediaPending,
		isError: isMediaError,
	} = useQuery(
		api.media.meta.queryOptions({
			input: { id: slotId, index },
		}),
	);

	if (isSlotPending || isMediaPending) {
		return <Loader />;
	}

	if (isSlotError || !slot) {
		return (
			<Alert variant="destructive">
				<AlertTitle>Session Not Found</AlertTitle>
				<AlertDescription>
					The requested session could not be loaded or does not exist.
				</AlertDescription>
			</Alert>
		);
	}

	if (isMediaError || !media) {
		return (
			<Alert variant="destructive">
				<AlertTitle>Media Unavailable</AlertTitle>
				<AlertDescription>
					The recording pipeline for this session could not be loaded.
				</AlertDescription>
			</Alert>
		);
	}

	const videoIndexes = files
		.flatMap((file) => {
			const match = file.match(/\/videos\/(\d+)\.mp4$/);
			return match?.[1] ? [Number(match[1])] : [];
		})
		.sort((a, b) => a - b);

	return (
		<MediaPipeline
			slot={slot}
			media={media}
			index={index}
			videoIndexes={videoIndexes}
			onIndexChange={setIndex}
		/>
	);
}

export default function Page() {
	const params = useParams<{ id: string }>();
	const slotId = params?.id;

	if (!slotId) {
		return (
			<Alert variant="destructive">
				<AlertTitle>Invalid Session ID</AlertTitle>
				<AlertDescription>
					No session identifier was found in the URL.
				</AlertDescription>
			</Alert>
		);
	}

	return <SessionMedia slotId={slotId} />;
}
