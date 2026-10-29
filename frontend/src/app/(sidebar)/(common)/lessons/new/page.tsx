"use client";

import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import {
	Frame,
	FrameActions,
	FrameDescription,
	FrameHeader,
	FramePanel,
	FrameTitle,
} from "@/components/reui/frame";
import { Button } from "@/components/ui/button";
import { CreateLessonForm } from "../_components/lesson-form";

export default function Page() {
	return (
		<Frame>
			<FrameHeader>
				<FrameTitle>Create Lesson</FrameTitle>
				<FrameDescription>
					Define lesson curriculum details, language, and duration
				</FrameDescription>
				<FrameActions>
					<Button asChild variant="outline">
						<Link href="/lessons">
							<ArrowLeftIcon />
							List
						</Link>
					</Button>
				</FrameActions>
			</FrameHeader>
			<FramePanel>
				<CreateLessonForm />
			</FramePanel>
		</Frame>
	);
}
