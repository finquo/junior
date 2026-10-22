"use client";

import { useQuery } from "@tanstack/react-query";
import { langFlag, langName } from "language-emoji";
import { BookOpenIcon } from "lucide-react";
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
	TimelineTitle,
} from "@/components/reui/timeline";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { api } from "@/hooks/api";

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
		<Frame spacing="sm">
			<FramePanel>
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
				{lessons.length > 0 ? (
					<Timeline defaultValue={activeStep}>
						{lessons.map((lesson) => (
							<TimelineItem key={lesson.id} step={lesson.position}>
								<TimelineIndicator />
								<TimelineSeparator />
								<TimelineHeader>
									<TimelineDate>Lesson {lesson.position}</TimelineDate>
									<TimelineTitle>
										<span>{lesson.name}</span>
										<Badge
											variant={
												lesson.attended
													? "success"
													: lesson.id === nextLesson?.id
														? "info"
														: "outline"
											}
										>
											{lesson.attended
												? "Attended"
												: lesson.id === nextLesson?.id
													? "Up next"
													: "Upcoming"}
										</Badge>
									</TimelineTitle>
								</TimelineHeader>
								{lesson.description && (
									<TimelineContent>{lesson.description}</TimelineContent>
								)}
								<TimelineContent className="flex flex-wrap items-center gap-1">
									<Badge variant="secondary">
										{langFlag(lesson.language)} {langName(lesson.language)}
									</Badge>
									{lesson.period && (
										<Badge variant="outline">
											{formatTimeString(lesson.period)}
										</Badge>
									)}
								</TimelineContent>
							</TimelineItem>
						))}
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
