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
import Link from "next/link";
import Loader from "@/components/loader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
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

const statusVariant: Record<
	string,
	"default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info"
> = {
	scheduled: "info",
	started: "success",
	rescheduled: "warning",
	request_reschedule: "destructive",
	attended: "secondary",
};

function SessionRow({ slot }: { slot: SlotRecord }) {
	const badgeVariant = statusVariant[slot.status] ?? "secondary";

	return (
		<Item variant="outline">
			<ItemMedia variant="icon">
				<CalendarClockIcon />
			</ItemMedia>
			<ItemContent>
				<ItemTitle>
					<FetchLesson
						id={slot.lessonId}
						isPending={<Skeleton className="h-4 w-32" />}
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
				<Badge variant={badgeVariant}>{snakeToTitleCase(slot.status)}</Badge>
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
				<AlertDescription>
					Your sessions could not be loaded.
				</AlertDescription>
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

	const nextBadgeVariant = next
		? (statusVariant[next.status] ?? "secondary")
		: "secondary";

	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			<Card>
				<CardHeader>
					<CardTitle>Next Session</CardTitle>
					<CardDescription>Your next booked slot</CardDescription>
					{next ? (
						<CardAction>
							<Badge variant={nextBadgeVariant}>
								{snakeToTitleCase(next.status)}
							</Badge>
						</CardAction>
					) : null}
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
										isPending={<Skeleton className="h-4 w-32" />}
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
										isPending={<Skeleton className="h-4 w-32" />}
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
									<Button asChild>
										<Link
											href={`/call/${next.id}` as "/"}
											target="_blank"
											rel="noopener noreferrer"
										>
											Open Call
										</Link>
									</Button>
								</ItemActions>
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
						<Empty>
							<EmptyHeader>
								<EmptyMedia variant="icon">
									<CalendarChevronsRightIcon />
								</EmptyMedia>
								<EmptyTitle>Nothing scheduled</EmptyTitle>
								<EmptyDescription>
									New bookings from your scheduler will show up here.
								</EmptyDescription>
							</EmptyHeader>
						</Empty>
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
						<Empty>
							<EmptyHeader>
								<EmptyMedia variant="icon">
									<CalendarFoldIcon />
								</EmptyMedia>
								<EmptyTitle>No past sessions</EmptyTitle>
								<EmptyDescription>
									Sessions you complete will show up here.
								</EmptyDescription>
							</EmptyHeader>
						</Empty>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
