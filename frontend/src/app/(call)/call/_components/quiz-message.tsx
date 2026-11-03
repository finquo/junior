"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import type { QuizMessage } from "backend/config";
import { quizMessageZod } from "backend/config";
import { sileo as toast } from "sileo";
import {
	Item,
	ItemContent,
	ItemDescription,
	ItemGroup,
	ItemTitle,
} from "@/components/ui/item";
import {
	Questionnaire,
	QuestionnaireActions,
	QuestionnaireChoice,
	QuestionnaireChoices,
	QuestionnaireError,
	QuestionnaireInput,
	QuestionnaireItem,
	QuestionnaireSubmit,
	QuestionnaireTitle,
} from "@/components/ui/questionnaire";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/hooks/api";
import { RenderWhenRole } from "@/hooks/role";

export function parseQuizMessage(text: string): QuizMessage | null {
	try {
		const parsed = quizMessageZod.safeParse(JSON.parse(text));
		return parsed.success ? parsed.data : null;
	} catch {
		return null;
	}
}

export function QuizMessageCard({ message }: { message: QuizMessage }) {
	const { data: questions, isPending } = useQuery(
		api.core.lesson.quiz.queryOptions({
			input: { lessonId: message.lessonId, quizIds: message.quizIds },
		}),
	);

	if (isPending) return <Skeleton className="h-24 w-full" />;

	return (
		<RenderWhenRole
			role="student"
			fallback={<QuizReadonly questions={questions ?? []} />}
		>
			<QuizAnswer message={message} questions={questions ?? []} />
		</RenderWhenRole>
	);
}

function QuizReadonly({
	questions,
}: {
	questions: { id: string; question: string }[];
}) {
	return (
		<ItemGroup>
			{questions.map((question) => (
				<Item key={question.id} variant="outline" size="sm">
					<ItemContent>
						<ItemTitle>{question.question}</ItemTitle>
						<ItemDescription>Only the student can answer.</ItemDescription>
					</ItemContent>
				</Item>
			))}
		</ItemGroup>
	);
}

type QuizQuestion = Parameters<typeof QuizReadonly>[0]["questions"][number] & {
	type: "choices" | "options" | "text";
	choices?: string[];
	options?: string[];
};

function QuizAnswer({
	message,
	questions,
}: {
	message: QuizMessage;
	questions: QuizQuestion[];
}) {
	const submit = useMutation(
		api.core.lesson.submit.mutationOptions({
			onSuccess: () => toast.success({ title: "Answers submitted" }),
			onError: (error) =>
				toast.error({ title: "Could not submit", description: error.message }),
		}),
	);

	function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();

		const formData = new FormData(event.currentTarget);
		const answers = questions.map((question) => ({
			questionId: question.id,
			anwser:
				question.type === "choices"
					? formData.getAll(question.id).map(String)
					: String(formData.get(question.id) ?? ""),
		}));

		submit.mutate({
			slotId: message.slotId,
			lessonId: message.lessonId,
			answers,
		});
	}

	return (
		<Questionnaire
			items={questions.map((question) => ({
				name: question.id,
				required: true,
			}))}
			onSubmit={handleSubmit}
		>
			{questions.map((question) => {
				const choices =
					question.type === "choices"
						? (question.choices ?? [])
						: (question.options ?? []);
				const isText = question.type === "text";

				return (
					<QuestionnaireItem
						key={question.id}
						name={question.id}
						required
						multiple={question.type === "choices"}
					>
						<QuestionnaireTitle>{question.question}</QuestionnaireTitle>
						<QuestionnaireChoices>
							{choices.map((choice) => (
								<QuestionnaireChoice key={choice} value={choice}>
									{choice}
								</QuestionnaireChoice>
							))}
							{isText && <QuestionnaireInput aria-label={question.question} />}
						</QuestionnaireChoices>
						<QuestionnaireError />
					</QuestionnaireItem>
				);
			})}
			<QuestionnaireActions>
				<QuestionnaireSubmit disabled={submit.isPending}>
					Submit
				</QuestionnaireSubmit>
			</QuestionnaireActions>
		</Questionnaire>
	);
}
