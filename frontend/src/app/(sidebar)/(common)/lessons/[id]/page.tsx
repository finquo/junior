"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Loader from "@/components/loader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { api } from "@/hooks/api";
import { LessonProfile } from "../_components/profile";

function Lesson({ lessonId }: { lessonId: string }) {
	const { data, isPending, isError } = useQuery(
		api.core.lesson.get.queryOptions({
			input: { id: lessonId },
		}),
	);

	if (isPending) {
		return <Loader />;
	}

	if (isError || !data) {
		return (
			<Alert variant="destructive">
				<AlertTitle>Lesson Not Found</AlertTitle>
				<AlertDescription>
					The requested lesson could not be loaded or does not exist.
				</AlertDescription>
			</Alert>
		);
	}

	return <LessonProfile data={data} />;
}

export default function Page() {
	const params = useParams<{ id: string }>();
	const lessonId = params?.id;

	if (!lessonId) {
		return (
			<Alert variant="destructive">
				<AlertTitle>Invalid Lesson ID</AlertTitle>
				<AlertDescription>
					No lesson identifier was found in the URL.
				</AlertDescription>
			</Alert>
		);
	}

	return <Lesson lessonId={lessonId} />;
}
