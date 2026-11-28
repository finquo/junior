"use client";

import { ArrowLeftIcon, VideoIcon } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import {
	Frame,
	FrameActions,
	FrameDescription,
	FrameHeader,
	FramePanel,
	FrameTitle,
} from "@/components/reui/frame";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Toggle } from "@/components/ui/toggle";
import { api } from "@/hooks/api";
import { LoadQuery } from "@/hooks/load";
import { CourseVideoFileList } from "./_components/file-list";

function CourseVideoMedia({ videoId }: { videoId: string }) {
	const [playableOnly, setPlayableOnly] = useState(true);

	return (
		<LoadQuery
			label="Course video files"
			api={api.stream.files.queryOptions({
				input: { videoId },
			})}
		>
			{(files) => (
				<Frame>
					<FrameHeader>
						<FrameTitle>{videoId}</FrameTitle>
						<FrameDescription>
							Source and converted files stored for this video
						</FrameDescription>
						<FrameActions>
							<ButtonGroup>
								<Toggle
									variant="outline"
									pressed={playableOnly}
									onPressedChange={setPlayableOnly}
								>
									<VideoIcon />
									Playable Files Only
								</Toggle>
								<Button variant="outline" asChild>
									<Link href={"/courses/medias" as "/"}>
										<ArrowLeftIcon />
										Back
									</Link>
								</Button>
							</ButtonGroup>
						</FrameActions>
					</FrameHeader>
					<FramePanel>
						<CourseVideoFileList
							files={files}
							videoId={videoId}
							playableOnly={playableOnly}
						/>
					</FramePanel>
				</Frame>
			)}
		</LoadQuery>
	);
}

export default function Page() {
	const videoId = useParams<{ id: string }>().id;

	return <CourseVideoMedia videoId={videoId} />;
}
