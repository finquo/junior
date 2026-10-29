"use client";

import {
	Frame,
	FrameDescription,
	FrameHeader,
	FramePanel,
	FrameTitle,
} from "@/components/reui/frame";
import { CreateLessonForm } from "../_components/lesson-form";

export default function Page() {
	return (
		<Frame>
			<FrameHeader>
				<FrameTitle>Create Lesson</FrameTitle>
				<FrameDescription>
					Define lesson curriculum details, language, and duration
				</FrameDescription>
			</FrameHeader>
			<FramePanel>
				<CreateLessonForm />
			</FramePanel>
		</Frame>
	);
}
