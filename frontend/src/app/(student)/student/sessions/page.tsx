"use client";

import { useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import {
	BookOpenIcon,
	CalendarChevronsRightIcon,
	CalendarClockIcon,
	CalendarFoldIcon,
	UserRoundIcon,
	VideoIcon,
} from "lucide-react";
import { Alert } from "@/components/arc/alert/alert";
import type { BadgeTone } from "@/components/arc/badge/badge";
import { Badge } from "@/components/arc/badge/badge";
import { Button as ArcButton } from "@/components/arc/button/button";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/arc/card/card";
import { EmptyState } from "@/components/arc/empty-state/empty-state";
import {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemGroup,
	ItemMedia,
	ItemTitle,
} from "@/components/arc/item/item";
import { Skeleton } from "@/components/arc/skeleton/skeleton";
import Loader from "@/components/loader";
import { api } from "@/hooks/api";
import { FetchLesson } from "@/hooks/lesson";
import { FetchUser } from "@/hooks/user";
import type { API_Returns } from "@/lib/api";
import { snakeToTitleCase } from "@/lib/utils";

type SlotRecord = API_Returns["student"]["getSlots"][number];

const statusTone: Record<string, BadgeTone> = {
	scheduled: "info",
	started: "success",
	rescheduled: "warning",
	request_reschedule: "danger",
	attended: "neutral",
};

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
						isPending={<Skeleton lines={1} />}
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
				<Badge tone={statusTone[slot.status] ?? "neutral"}>
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
			<Alert tone="danger" title="Sessions Unavailable">
				Your sessions could not be loaded.
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
		<div className="flex flex-col gap-4">
			<Card>
				<CardHeader>
					<CardTitle>Next Session</CardTitle>
					<CardDescription>Your next booked slot</CardDescription>
					{next && (
						<CardAction>
							<Badge tone={statusTone[next.status] ?? "neutral"}>
								{snakeToTitleCase(next.status)}
							</Badge>
						</CardAction>
					)}
				</CardHeader>
				<CardContent>
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
										isPending={<Skeleton lines={1} />}
										notFound={
											<ItemDescription>Untitled session</ItemDescription>
										}
									>
										{(lesson) => (
											<ItemDescription>{lesson.name}</ItemDescription>
										)}
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
										isPending={<Skeleton lines={1} />}
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
									<ItemTitle>Open Call</ItemTitle>
									<ItemDescription>
										Joins the in-built call, or redirects to the external tool
										the session uses.
									</ItemDescription>
								</ItemContent>
								<ItemActions>
									<ArcButton
										link={`/call/${next.id}`}
										target="_blank"
										rel="noopener noreferrer"
									>
										Open Call
									</ArcButton>
								</ItemActions>
							</Item>
						</ItemGroup>
					) : (
						<EmptyState
							icon={<CalendarClockIcon />}
							title="No upcoming session"
							description="You have no session booked right now."
						/>
					)}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Upcoming Sessions</CardTitle>
					<CardDescription>Slots booked from now on</CardDescription>
				</CardHeader>
				<CardContent>
					{upcoming.length > 0 ? (
						<ItemGroup>
							{upcoming.map((slot) => (
								<SessionRow key={slot.id} slot={slot} />
							))}
						</ItemGroup>
					) : (
						<EmptyState
							icon={<CalendarChevronsRightIcon />}
							title="Nothing scheduled"
							description="New bookings from your scheduler will show up here."
						/>
					)}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Past Sessions</CardTitle>
					<CardDescription>Sessions that have already ended</CardDescription>
				</CardHeader>
				<CardContent>
					{past.length > 0 ? (
						<ItemGroup>
							{past.map((slot) => (
								<SessionRow key={slot.id} slot={slot} />
							))}
						</ItemGroup>
					) : (
						<EmptyState
							icon={<CalendarFoldIcon />}
							title="No past sessions"
							description="Sessions you complete will show up here."
						/>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
