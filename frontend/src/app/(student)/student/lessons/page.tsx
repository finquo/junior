"use client";

import { useQuery } from "@tanstack/react-query";
import { langFlag, langName } from "language-emoji";
import { BookOpenIcon, ClockIcon, LanguagesIcon } from "lucide-react";
import { formatTimeString } from "utils";
import Loader from "@/components/loader";
import {
	Frame,
	FrameActions,
	FrameDescription,
	FrameHeader,
	FramePanel,
	FrameTitle,
} from "@/components/reui/frame";
import {
	Timeline,
	TimelineContent,
	TimelineDate,
	TimelineHeader,
	TimelineIndicator,
	TimelineItem,
	TimelineSeparator,
} from "@/components/reui/timeline";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge, ColorBadge } from "@/components/ui/badge";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemTitle,
} from "@/components/ui/item";
import { api } from "@/hooks/api";

function getStatus(
	lesson: { id: string; attended: boolean },
	nextLessonId: string | undefined,
): {
	label: string;
	variant: "success" | "info" | "outline";
} {
	if (lesson.attended) return { label: "Attended", variant: "success" };
	if (lesson.id === nextLessonId) return { label: "Up next", variant: "info" };
	return { label: "Upcoming", variant: "outline" };
}

export default function Page() {
	const {
		data: lessons = [],
		isPending,
		isError,
	} = useQuery(api.student.getLessons.queryOptions());

	if (isPending) return <Loader />;

	if (isError) {
		return (
			<Alert variant="destructive">
				<AlertTitle>Lessons Unavailable</AlertTitle>
				<AlertDescription>Your lessons could not be loaded.</AlertDescription>
			</Alert>
		);
	}

	const attendedCount = lessons.filter((lesson) => lesson.attended).length;
	const nextLesson = lessons.find((lesson) => !lesson.attended);
	const activeStep = nextLesson ? nextLesson.position - 1 : lessons.length;

	return (
		<Frame>
			<FrameHeader>
				<FrameTitle>Your Lessons</FrameTitle>
				<FrameDescription>
					The lessons in your program, in order
				</FrameDescription>
				<FrameActions>
					<Badge variant="secondary">
						{attendedCount} of {lessons.length} attended
					</Badge>
				</FrameActions>
			</FrameHeader>
			<FramePanel>
				{lessons.length > 0 ? (
					<Timeline defaultValue={activeStep}>
						{lessons.map((lesson) => {
							const status = getStatus(lesson, nextLesson?.id);
							return (
								<TimelineItem key={lesson.id} step={lesson.position}>
									<TimelineIndicator />
									<TimelineSeparator />
									<TimelineHeader>
										<TimelineDate>Lesson {lesson.position}</TimelineDate>
									</TimelineHeader>
									<TimelineContent>
										<Item variant="muted">
											<ItemContent>
												<ItemTitle>{lesson.name}</ItemTitle>
												{lesson.description && (
													<ItemDescription>
														{lesson.description}
													</ItemDescription>
												)}
												<ItemDescription className="space-x-2">
													<Badge variant="secondary">
														<LanguagesIcon />
														{langFlag(lesson.language)}{" "}
														{langName(lesson.language)}
													</Badge>
													{lesson.period && (
														<Badge variant="secondary">
															<ClockIcon />
															{formatTimeString(lesson.period)}
														</Badge>
													)}
												</ItemDescription>
											</ItemContent>
											<ItemActions>
												<ColorBadge>{status.label}</ColorBadge>
											</ItemActions>
										</Item>
									</TimelineContent>
								</TimelineItem>
							);
						})}
					</Timeline>
				) : (
					<Empty>
						<EmptyHeader>
							<EmptyMedia variant="icon">
								<BookOpenIcon />
							</EmptyMedia>
							<EmptyTitle>No lessons yet</EmptyTitle>
							<EmptyDescription>
								Lessons will appear here once your program is set up.
							</EmptyDescription>
						</EmptyHeader>
					</Empty>
				)}
			</FramePanel>
		</Frame>
	);
}
