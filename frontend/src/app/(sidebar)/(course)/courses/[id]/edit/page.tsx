"use client";

import { useParams } from "next/navigation";
import {
	Frame,
	FrameDescription,
	FrameHeader,
	FramePanel,
	FrameTitle,
} from "@/components/reui/frame";
import { api } from "@/hooks/api";
import { LoadQuery } from "@/hooks/load";
import { CourseEditForm } from "../../_components/edit-form";

export default function Page() {
	const id = useParams<{ id: string }>().id;

	return (
		<LoadQuery
			label="Course"
			api={api.core.course.get.queryOptions({ input: { id } })}
		>
			{(data) => (
				<Frame>
					<FrameHeader>
						<FrameTitle>Edit Course</FrameTitle>
						<FrameDescription>
							Update course details and pricing.
						</FrameDescription>
					</FrameHeader>
					<FramePanel>
						<CourseEditForm course={data} />
					</FramePanel>
				</Frame>
			)}
		</LoadQuery>
	);
}
