"use client";

import { useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import {
	BookOpenIcon,
	CalendarClockIcon,
	UserRoundIcon,
	VideoIcon,
} from "lucide-react";
import Loader from "@/components/loader";
import {
	Frame,
	FrameActions,
	FrameDescription,
	FrameHeader,
	FramePanel,
	FrameTitle,
} from "@/components/reui/frame";
import { getSlotStatusBadgeVariant } from "@/components/slot-details";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
	ItemGroup,
	ItemMedia,
	ItemTitle,
} from "@/components/ui/item";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/hooks/api";
import { FetchLesson } from "@/hooks/lesson";
import { FetchUser } from "@/hooks/user";
import type { API_Returns } from "@/lib/api";
import { snakeToTitleCase } from "@/lib/utils";

type SlotRecord = API_Returns["student"]["getSlots"][number];

function SessionRow({ slot }: { slot: SlotRecord }) {
	return (
		<Item variant="outline">
			<ItemMedia variant="icon">
				<CalendarClockIcon />
			</ItemMedia>
			<ItemContent>
				<ItemTitle>
					<FetchLesson
						id={slot.lessonId}
						isPending={<Skeleton className="h-4 w-24" />}
						notFound={<span>Untitled session</span>}
					>
						{(lesson) => <span>{lesson.name}</span>}
					</FetchLesson>
				</ItemTitle>
				<ItemDescription>
					{format(new Date(slot.startTime), "EEE, MMM d • p")} –{" "}
					{format(new Date(slot.expectedEndTime), "p")}
				</ItemDescription>
			</ItemContent>
			<ItemActions>
				<Badge variant={getSlotStatusBadgeVariant(slot.status)}>
					{snakeToTitleCase(slot.status)}
				</Badge>
			</ItemActions>
		</Item>
	);
}

export default function Page() {
	const {
		data: slots = [],
		isPending,
		isError,
	} = useQuery(api.student.getSlots.queryOptions());

	if (isPending) return <Loader />;

	if (isError) {
		return (
			<Alert variant="destructive">
				<AlertTitle>Sessions Unavailable</AlertTitle>
				<AlertDescription>Your sessions could not be loaded.</AlertDescription>
			</Alert>
		);
	}

	const now = Date.now();
	const upcoming = slots
		.filter((slot) => new Date(slot.expectedEndTime).getTime() >= now)
		.sort(
			(a, b) =>
				new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
		);
	const past = slots
		.filter((slot) => new Date(slot.expectedEndTime).getTime() < now)
		.sort(
			(a, b) =>
				new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
		);
	const next = upcoming[0];

	return (
		<Frame spacing="sm">
			<FramePanel>
				<FrameHeader>
					<FrameTitle>Next Session</FrameTitle>
					<FrameDescription>Your next booked slot</FrameDescription>
					{next && (
						<FrameActions>
							<Badge variant={getSlotStatusBadgeVariant(next.status)}>
								{snakeToTitleCase(next.status)}
							</Badge>
						</FrameActions>
					)}
				</FrameHeader>
				{next ? (
					<ItemGroup>
						<Item variant="outline">
							<ItemMedia variant="icon">
								<CalendarClockIcon />
							</ItemMedia>
							<ItemContent>
								<ItemTitle>
									{format(new Date(next.startTime), "EEEE, MMMM d")}
								</ItemTitle>
								<ItemDescription>
									{format(new Date(next.startTime), "p")} –{" "}
									{format(new Date(next.expectedEndTime), "p")} ·{" "}
									{formatDistanceToNow(new Date(next.startTime), {
										addSuffix: true,
									})}
								</ItemDescription>
							</ItemContent>
						</Item>

						<Item variant="outline">
							<ItemMedia variant="icon">
								<BookOpenIcon />
							</ItemMedia>
							<ItemContent>
								<ItemTitle>Lesson</ItemTitle>
								<FetchLesson
									id={next.lessonId}
									isPending={<Skeleton className="h-4 w-24" />}
									notFound={<ItemDescription>Untitled session</ItemDescription>}
								>
									{(lesson) => <ItemDescription>{lesson.name}</ItemDescription>}
								</FetchLesson>
							</ItemContent>
						</Item>

						<Item variant="outline">
							<ItemMedia variant="icon">
								<UserRoundIcon />
							</ItemMedia>
							<ItemContent>
								<ItemTitle>Teacher</ItemTitle>
								<FetchUser
									id={next.teacherId}
									isPending={<Skeleton className="h-4 w-24" />}
									notFound={<ItemDescription>Not assigned</ItemDescription>}
								>
									{(teacher) => (
										<ItemDescription>{teacher.name}</ItemDescription>
									)}
								</FetchUser>
							</ItemContent>
						</Item>

						<Item variant="outline">
							<ItemMedia variant="icon">
								<VideoIcon />
							</ItemMedia>
							<ItemContent>
								<ItemTitle>Meeting Link</ItemTitle>
								<ItemDescription>
									{next.meetingLink ?? "Not shared yet"}
								</ItemDescription>
							</ItemContent>
						</Item>
					</ItemGroup>
				) : (
					<Empty>
						<EmptyHeader>
							<EmptyMedia variant="icon">
								<CalendarClockIcon />
							</EmptyMedia>
							<EmptyTitle>No upcoming session</EmptyTitle>
							<EmptyDescription>
								You have no session booked right now.
							</EmptyDescription>
						</EmptyHeader>
					</Empty>
				)}
			</FramePanel>

			<FramePanel>
				<FrameHeader>
					<FrameTitle>Upcoming Sessions</FrameTitle>
					<FrameDescription>Slots booked from now on</FrameDescription>
				</FrameHeader>
				{upcoming.length > 0 ? (
					<ItemGroup>
						{upcoming.map((slot) => (
							<SessionRow key={slot.id} slot={slot} />
						))}
					</ItemGroup>
				) : (
					<Empty>
						<EmptyHeader>
							<EmptyTitle>Nothing scheduled</EmptyTitle>
							<EmptyDescription>
								New bookings from your scheduler will show up here.
							</EmptyDescription>
						</EmptyHeader>
					</Empty>
				)}
			</FramePanel>

			<FramePanel>
				<FrameHeader>
					<FrameTitle>Past Sessions</FrameTitle>
					<FrameDescription>Sessions that have already ended</FrameDescription>
				</FrameHeader>
				{past.length > 0 ? (
					<ItemGroup>
						{past.map((slot) => (
							<SessionRow key={slot.id} slot={slot} />
						))}
					</ItemGroup>
				) : (
					<Empty>
						<EmptyHeader>
							<EmptyTitle>No past sessions</EmptyTitle>
							<EmptyDescription>
								Sessions you complete will show up here.
							</EmptyDescription>
						</EmptyHeader>
					</Empty>
				)}
			</FramePanel>
		</Frame>
	);
}
