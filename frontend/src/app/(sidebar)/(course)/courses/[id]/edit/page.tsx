"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Loader from "@/components/loader";
import {
	Frame,
	FrameDescription,
	FrameHeader,
	FramePanel,
	FrameTitle,
} from "@/components/reui/frame";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { api } from "@/hooks/api";
import { CourseEditForm } from "../../_components/edit-form";

function EditCourse({ courseId }: { courseId: string }) {
	const courseQuery = useQuery(
		api.core.course.get.queryOptions({ input: { id: courseId } }),
	);

	if (courseQuery.isPending) {
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
		<Frame>
			<FrameHeader>
				<FrameTitle>Edit Course</FrameTitle>
				<FrameDescription>Update course details and pricing.</FrameDescription>
			</FrameHeader>
			<FramePanel>
				<CourseEditForm course={courseQuery.data} />
			</FramePanel>
		</Frame>
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

	return <EditCourse courseId={courseId} />;
}
