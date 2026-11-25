"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Loader from "@/components/loader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { api } from "@/hooks/api";
import { CourseProfile } from "../_components/profile";

function Course({ courseId }: { courseId: string }) {
	const courseQuery = useQuery(
		api.core.course.get.queryOptions({ input: { id: courseId } }),
	);
	const modulesQuery = useQuery(
		api.core.module.list.queryOptions({
			input: { course: courseId },
		}),
	);
	const videosQuery = useQuery(
		api.core.video.list.queryOptions({
			input: { course: courseId },
		}),
	);

	if (
		courseQuery.isPending ||
		modulesQuery.isPending ||
		videosQuery.isPending
	) {
		return <Loader />;
	}

	if (courseQuery.isError || !courseQuery.data) {
		return (
			<Alert variant="destructive">
				<AlertTitle>Course Not Found</AlertTitle>
				<AlertDescription>
					The requested course could not be loaded or does not exist.
				</AlertDescription>
			</Alert>
		);
	}

	return (
		<CourseProfile
			data={courseQuery.data}
			modules={modulesQuery.data ?? []}
			videos={videosQuery.data ?? []}
		/>
	);
}

export default function Page() {
	const params = useParams<{ id: string }>();
	const courseId = params?.id;

	if (!courseId) {
		return (
			<Alert variant="destructive">
				<AlertTitle>Invalid Course</AlertTitle>
				<AlertDescription>
					No valid course identifier was found in the URL.
				</AlertDescription>
			</Alert>
		);
	}

	return <Course courseId={courseId} />;
}
