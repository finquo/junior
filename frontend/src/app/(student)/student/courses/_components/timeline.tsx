import { CheckIcon, ClapperboardIcon, VideoIcon } from "lucide-react";
import Link from "next/link";
import {
	TimelineAction,
	TimelineContent,
	TimelineHeader,
	TimelineIndicator,
	TimelineItem,
	Timeline as TimelineRoot,
	TimelineSeparator,
	TimelineTitle,
} from "@/components/reui/timeline";
import {
	Attachment,
	AttachmentAction,
	AttachmentActions,
	AttachmentContent,
	AttachmentDescription,
	AttachmentMedia,
	AttachmentTitle,
} from "@/components/ui/attachment";
import { Badge } from "@/components/ui/badge";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { API_Returns } from "@/lib/api";

type Modules = API_Returns["student"]["getCourseVideoGroups"];
type Group = Modules[number];
type Video = Group["videos"][number];

export function VideoItem({ video }: { video: Video }) {
	const isWatched = video.status === "watched";

	return (
		<Link href={`/stream/${video.id}` as "/"}>
			<Attachment
				size={"lg"}
				className={isWatched ? "border-2 border-primary" : "border-2 bg-muted"}
				orientation={"thumbnail"}
			>
				<AttachmentMedia variant={"thumbnail"}>
					<img src={"/banner-blobs.png"} alt={video.name} />
				</AttachmentMedia>
				<AttachmentContent>
					<AttachmentTitle>{video.name}</AttachmentTitle>
					{video.description && (
						<AttachmentDescription>{video.description}</AttachmentDescription>
					)}
					<AttachmentDescription>ksndjd</AttachmentDescription>
				</AttachmentContent>
				{isWatched && (
					<AttachmentActions>
						<AttachmentAction aria-label="Remove sales-dashboard.pdf">
							<CheckIcon />
						</AttachmentAction>
					</AttachmentActions>
				)}
			</Attachment>
		</Link>
	);
}

export function Timeline({ modules }: { modules: Modules }) {
	const activeStep =
		modules.find((module) => module.status === "upcoming")?.position ??
		modules.length + 1;

	if (modules.length === 0)
		return (
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<ClapperboardIcon />
					</EmptyMedia>
					<EmptyTitle>No modules yet</EmptyTitle>
					<EmptyDescription>
						Modules will appear here once your course is set up.
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		);

	return (
		<ScrollArea className="h-150">
			<TimelineRoot className="p-0" value={activeStep}>
				{modules.map((module) => {
					const isAttended = module.status === "attended";
					const emptyState =
						module.videos.length === 0 ? (
							<Empty>
								<EmptyHeader>
									<EmptyMedia variant="icon">
										<VideoIcon />
									</EmptyMedia>
									<EmptyTitle>No videos yet</EmptyTitle>
									<EmptyDescription>
										Videos will appear here once added to this module.
									</EmptyDescription>
								</EmptyHeader>
							</Empty>
						) : null;

					return (
						<TimelineItem key={module.id} step={module.position}>
							<TimelineIndicator />
							<TimelineSeparator />
							{/*<TimelineSeparator className="flex items-center justify-center text-primary">
								{">"}
							</TimelineSeparator>*/}
							<TimelineHeader>
								<TimelineTitle>{`Module ${module.position}: ${module.name}`}</TimelineTitle>
								{isAttended && (
									<TimelineAction>
										<Badge variant={"success"}>Attended</Badge>
									</TimelineAction>
								)}
							</TimelineHeader>
							{emptyState ? (
								<TimelineContent>{emptyState}</TimelineContent>
							) : (
								<TimelineContent className="flex flex-row flex-wrap gap-3 pt-2">
									{module.videos.map((video) => (
										<VideoItem key={video.id} video={video} />
									))}
									{module.videos.map((video) => (
										<VideoItem key={video.id} video={video} />
									))}
									{module.videos.map((video) => (
										<VideoItem key={video.id} video={video} />
									))}
								</TimelineContent>
							)}
						</TimelineItem>
					);
				})}
			</TimelineRoot>
		</ScrollArea>
	);
}
