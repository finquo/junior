"use client";

import { useQuery } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { useParams } from "next/navigation";
import { QuizList } from "@/components/custom/quiz";
import Loader from "@/components/loader";
import {
	Frame,
	FrameActions,
	FrameDescription,
	FrameHeader,
	FramePanel,
	FrameTitle,
} from "@/components/reui/frame";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { api } from "@/hooks/api";
import { RenderWhenRole } from "@/hooks/role";
import { AddQuizDialog } from "../../_components/add-quiz-dialog";

function LessonQuiz({ lessonId }: { lessonId: string }) {
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

	const quiz = data.quiz ?? [];

	return (
		<Frame>
			<FrameHeader>
				<FrameTitle>Quiz</FrameTitle>
				<FrameDescription>Questions attached to {data.name}</FrameDescription>
				<FrameActions>
					<RenderWhenRole role={["admin", "scheduler"]}>
						<AddQuizDialog lessonId={lessonId}>
							<Button>
								<PlusIcon />
								Add Quiz
							</Button>
						</AddQuizDialog>
					</RenderWhenRole>
				</FrameActions>
			</FrameHeader>
			<FramePanel>
				<QuizList editable quiz={quiz} lessonId={lessonId} />
			</FramePanel>
		</Frame>
	);
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

	return <LessonQuiz lessonId={lessonId} />;
}
