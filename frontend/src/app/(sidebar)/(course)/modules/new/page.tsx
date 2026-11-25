"use client";

import {
	Frame,
	FrameDescription,
	FrameHeader,
	FramePanel,
	FrameTitle,
} from "@/components/reui/frame";
import { ModuleCreateForm } from "../../_components/module-form";

export default function Page() {
	return (
		<Frame>
			<FrameHeader>
				<FrameTitle>Create Module</FrameTitle>
				<FrameDescription>
					Add module metadata and quiz questions to a course
				</FrameDescription>
			</FrameHeader>
			<FramePanel>
				<ModuleCreateForm />
			</FramePanel>
		</Frame>
	);
}
