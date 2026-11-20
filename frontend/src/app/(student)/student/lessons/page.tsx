"use client";

import { useQuery } from "@tanstack/react-query";
import { langFlag, langName } from "language-emoji";
import { BookOpenIcon } from "lucide-react";
import { formatTimeString } from "utils";
import Loader from "@/components/loader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
import { Progress } from "@/components/ui/progress";
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
				<AlertDescription>
					Your lessons could not be loaded.
				</AlertDescription>
			</Alert>
		);
	}

	const attendedCount = lessons.filter((lesson) => lesson.attended).length;
	const progressValue =
		lessons.length > 0 ? (attendedCount / lessons.length) * 100 : 0;

	return (
		<Card>
			<CardHeader>
				<CardTitle>Your Lessons</CardTitle>
				<CardDescription>The lessons in your program, in order</CardDescription>
				<CardAction>
					<Badge variant="secondary">
						{attendedCount} of {lessons.length} attended
					</Badge>
				</CardAction>
			</CardHeader>
			<CardContent>
				{lessons.length > 0 ? (
					<ItemGroup>
						<Item variant="muted">
							<ItemContent>
								<ItemTitle>Progress</ItemTitle>
								<ItemDescription>
									{attendedCount} of {lessons.length} lessons attended
								</ItemDescription>
							</ItemContent>
							<ItemActions>
								<Progress value={progressValue} className="w-32" />
							</ItemActions>
						</Item>
						{lessons.map((lesson) => {
							const statusVariant = lesson.attended ? "success" : "outline";
							const statusLabel = lesson.attended ? "Attended" : "Upcoming";
							const details = [
								lesson.description,
								`${langFlag(lesson.language)} ${langName(lesson.language)}`,
								lesson.period ? formatTimeString(lesson.period) : undefined,
							]
								.filter(Boolean)
								.join(" · ");

							return (
								<Item key={lesson.id} variant="outline">
									<ItemMedia variant="icon">
										<BookOpenIcon />
									</ItemMedia>
									<ItemContent>
										<ItemTitle>
											{`Lesson ${lesson.position}: ${lesson.name}`}
										</ItemTitle>
										{details ? (
											<ItemDescription>{details}</ItemDescription>
										) : null}
									</ItemContent>
									<ItemActions>
										<Badge variant={statusVariant}>{statusLabel}</Badge>
									</ItemActions>
								</Item>
							);
						})}
					</ItemGroup>
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
			</CardContent>
		</Card>
	);
}
