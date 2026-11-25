import {
	Frame,
	FrameDescription,
	FrameHeader,
	FramePanel,
	FrameTitle,
} from "@/components/reui/frame";
import { CreateCourseForm } from "../_components/create-form";

export default function Page() {
	return (
		<Frame>
			<FrameHeader>
				<FrameTitle>Create Course</FrameTitle>
				<FrameDescription>
					Define the course details and regional pricing
				</FrameDescription>
			</FrameHeader>
			<FramePanel>
				<CreateCourseForm />
			</FramePanel>
		</Frame>
	);
}
