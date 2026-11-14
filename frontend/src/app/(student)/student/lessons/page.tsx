"use client";

import { useQuery } from "@tanstack/react-query";
import { langFlag, langName } from "language-emoji";
import { BookOpenIcon } from "lucide-react";
import { formatTimeString } from "utils";
import { Alert } from "@/components/arc/alert/alert";
import { Badge } from "@/components/arc/badge/badge";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/arc/card/card";
import { EmptyState } from "@/components/arc/empty-state/empty-state";
import { Stepper } from "@/components/arc/stepper/stepper";
import Loader from "@/components/loader";
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
			<Alert tone="danger" title="Lessons Unavailable">
				Your lessons could not be loaded.
			</Alert>
		);
	}

	const attendedCount = lessons.filter((lesson) => lesson.attended).length;
	const nextLesson = lessons.find((lesson) => !lesson.attended);
	const activeStep = nextLesson ? nextLesson.position - 1 : lessons.length;

	return (
		<Card>
			<CardHeader>
				<CardTitle>Your Lessons</CardTitle>
				<CardDescription>The lessons in your program, in order</CardDescription>
				<CardAction>
					<Badge tone="neutral">
						{attendedCount} of {lessons.length} attended
					</Badge>
				</CardAction>
			</CardHeader>
			<CardContent>
				{lessons.length > 0 ? (
					<Stepper
						orientation="vertical"
						label="Lesson progress"
						completeLabel="All lessons attended"
						current={activeStep}
						steps={lessons.map((lesson) => ({
							id: lesson.id,
							label: `Lesson ${lesson.position}: ${lesson.name}`,
							description: [
								lesson.description,
								`${langFlag(lesson.language)} ${langName(lesson.language)}`,
								lesson.period ? formatTimeString(lesson.period) : undefined,
							]
								.filter(Boolean)
								.join(" · "),
						}))}
					/>
				) : (
					<EmptyState
						icon={<BookOpenIcon />}
						title="No lessons yet"
						description="Lessons will appear here once your program is set up."
					/>
				)}
			</CardContent>
		</Card>
	);
}
