"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeftIcon, VideoIcon } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
	Frame,
	FrameActions,
	FrameDescription,
	FrameHeader,
	FramePanel,
	FrameTitle,
} from "@/components/reui/frame";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/hooks/api";
import { MediaFileList } from "./_components/file-list";

function SessionMedia({ slotId }: { slotId: string }) {
	const {
		data = [],
		isPending,
		isError,
	} = useQuery(
		api.media.library.files.queryOptions({
			input: { id: slotId },
		}),
	);

	if (isError) {
		return (
			<Alert variant="destructive">
				<AlertTitle>Media Unavailable</AlertTitle>
				<AlertDescription>
					The files for this session could not be loaded.
				</AlertDescription>
			</Alert>
		);
	}

	return (
		<Frame>
			<FrameHeader>
				<FrameTitle>{slotId}</FrameTitle>
				<FrameDescription>Files stored for this session</FrameDescription>
				<FrameActions>
					<ButtonGroup>
						{isPending && (
							<Button variant="outline" size="icon" disabled>
								<Spinner />
							</Button>
						)}
						<Button variant="outline" asChild>
							<Link href={`/slots/${slotId}/media` as "/"}>
								<VideoIcon />
								Pipeline
							</Link>
						</Button>
						<Button variant="outline" asChild>
							<Link href={"/medias" as "/"}>
								<ArrowLeftIcon />
								Back
							</Link>
						</Button>
					</ButtonGroup>
				</FrameActions>
			</FrameHeader>
			<FramePanel>
				<MediaFileList files={data} slotId={slotId} />
			</FramePanel>
		</Frame>
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
