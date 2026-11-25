"use client";

import { PlusIcon } from "lucide-react";
import { useParams } from "next/navigation";
import { QuizList } from "@/components/custom/quiz";
import {
	Frame,
	FrameActions,
	FrameDescription,
	FrameHeader,
	FramePanel,
	FrameTitle,
} from "@/components/reui/frame";
import { Button } from "@/components/ui/button";
import { api } from "@/hooks/api";
import { LoadQuery } from "@/hooks/load";
import { RenderWhenRole } from "@/hooks/role";
import { AddQuizDialog } from "../../_components/add-quiz-dialog";

export default function Page() {
	const id = useParams<{ id: string }>().id;

	return (
		<LoadQuery
			label="Lesson"
			api={api.core.lesson.get.queryOptions({ input: { id } })}
		>
			{(data) => (
				<Frame>
					<FrameHeader>
						<FrameTitle>Quiz</FrameTitle>
						<FrameDescription>
							Questions attached to {data.name}
						</FrameDescription>
						<FrameActions>
							<RenderWhenRole role={["admin", "scheduler"]}>
								<AddQuizDialog lessonId={id}>
									<Button>
										<PlusIcon />
										Add Quiz
									</Button>
								</AddQuizDialog>
							</RenderWhenRole>
						</FrameActions>
					</FrameHeader>
					<FramePanel>
						<QuizList editable quiz={data.quiz ?? []} lessonId={id} />
					</FramePanel>
				</Frame>
			)}
		</LoadQuery>
	);
}
