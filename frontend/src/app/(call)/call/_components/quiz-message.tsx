"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import type { QuizAnswerMessage, QuizMessage } from "backend/config";
import { quizAnswerMessageZod, quizMessageZod } from "backend/config";
import { CheckIcon } from "lucide-react";
import { sileo as toast } from "sileo";
import { Alert } from "@/components/arc/alert/alert";
import { Skeleton } from "@/components/arc/skeleton/skeleton";
import {
	Item,
	ItemContent,
	ItemDescription,
	ItemGroup,
	ItemTitle,
} from "@/components/arc/item/item";
import {
	Questionnaire,
	QuestionnaireActions,
	QuestionnaireChoice,
	QuestionnaireChoices,
	QuestionnaireError,
	QuestionnaireInput,
	QuestionnaireItem,
	QuestionnaireNext,
	QuestionnairePrevious,
	QuestionnaireProgress,
	QuestionnaireSkip,
	QuestionnaireSubmit,
	QuestionnaireTitle,
} from "@/components/ui/questionnaire";
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

export function parseQuizAnswerMessage(text: string): QuizAnswerMessage | null {
	try {
		const parsed = quizAnswerMessageZod.safeParse(JSON.parse(text));
		return parsed.success ? parsed.data : null;
	} catch {
		return null;
	}
}

export function QuizMessageCard({
	message,
	onSend,
}: {
	message: QuizMessage;
	onSend?: (text: string) => void;
}) {
	const { data: questions, isPending } = useQuery(
		api.core.quiz.get.queryOptions({
			input: { lessonId: message.lessonId, quizIds: message.quizIds },
		}),
	);

	if (isPending) return <Skeleton lines={2} className="w-full" />;

	if (!questions) return <Alert title="Questions not found" />;

	return (
		<RenderWhenRole
			role="student"
			fallback={<QuizReadonly questions={questions} />}
		>
			<QuizAnswer message={message} questions={questions} onSend={onSend} />
		</RenderWhenRole>
	);
}

type QuizQuestion = {
	id: string;
	question: string;
} & (
	| {
			type: "choices";
			choices: string[];
	  }
	| {
			type: "options";
			options: string[];
	  }
	| {
			type: "text";
	  }
);

function QuizReadonly({ questions }: { questions: QuizQuestion[] }) {
	return (
		<Questionnaire items={questions.map((q) => ({ name: q.id }))}>
			<QuestionnaireProgress />
			{questions.map((question) => {
				const choices =
					question.type === "choices"
						? question.choices
						: question.type === "options"
							? question.options
							: [];
				const isText = question.type === "text";

				return (
					<QuestionnaireItem key={question.id} name={question.id}>
						<QuestionnaireTitle>{question.question}</QuestionnaireTitle>
						<QuestionnaireChoices>
							{choices.map((choice) => (
								<QuestionnaireChoice key={choice} value={choice} disabled>
									{choice}
								</QuestionnaireChoice>
							))}
							{isText && (
								<QuestionnaireInput
									aria-label={question.question}
									disabled
									placeholder="Type the answer"
								/>
							)}
						</QuestionnaireChoices>
					</QuestionnaireItem>
				);
			})}
			<QuestionnaireActions>
				<QuestionnairePrevious />
				<QuestionnaireSkip />
				<QuestionnaireNext />
				<QuestionnaireSubmit disabled />
			</QuestionnaireActions>
		</Questionnaire>
	);
}

function QuizAnswer({
	message,
	questions,
	onSend,
}: {
	message: QuizMessage;
	questions: QuizQuestion[];
	onSend?: (text: string) => void;
}) {
	const submit = useMutation(
		api.core.quiz.submit.mutationOptions({
			onSuccess: () => toast.success({ title: "Answers submitted" }),
			onError: (error) =>
				toast.error({ title: "Could not submit", description: error.message }),
		}),
	);

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();

		const formData = new FormData(event.currentTarget);
		const answers = questions.map((question) => ({
			questionId: question.id,
			anwser:
				question.type === "choices"
					? formData.getAll(question.id).map(String)
					: String(formData.get(question.id) ?? ""),
		}));

		try {
			await submit.mutateAsync({
				slotId: message.slotId,
				lessonId: message.lessonId,
				answers,
			});
		} catch {
			return;
		}

		for (const answer of answers) {
			onSend?.(
				JSON.stringify({
					type: "quiz_answer",
					slotId: message.slotId,
					lessonId: message.lessonId,
					questionId: answer.questionId,
					anwser: answer.anwser,
				} satisfies QuizAnswerMessage),
			);
		}
	}

	return (
		<Questionnaire
			items={questions.map((q) => ({ name: q.id }))}
			onSubmit={handleSubmit}
		>
			<QuestionnaireProgress />
			{questions.map((question) => {
				const choices =
					question.type === "choices"
						? question.choices
						: question.type === "options"
							? question.options
							: [];
				const isText = question.type === "text";

				return (
					<QuestionnaireItem
						key={question.id}
						name={question.id}
						multiple={question.type === "choices"}
					>
						<QuestionnaireTitle>{question.question}</QuestionnaireTitle>
						<QuestionnaireChoices>
							{choices.map((choice) => (
								<QuestionnaireChoice key={choice} value={choice}>
									{choice}
								</QuestionnaireChoice>
							))}
							{isText && (
								<QuestionnaireInput
									placeholder="Type your anwser"
									aria-label={question.question}
								/>
							)}
						</QuestionnaireChoices>
						<QuestionnaireError />
					</QuestionnaireItem>
				);
			})}
			<QuestionnaireActions>
				<QuestionnairePrevious />
				<QuestionnaireNext />
				<QuestionnaireSkip />
				<QuestionnaireSubmit disabled={submit.isPending} />
			</QuestionnaireActions>
		</Questionnaire>
	);
}

function AnswerCheck({ chosen, label }: { chosen: boolean; label: string }) {
	return (
		<Item variant={chosen ? "secondary" : "outline"} size="sm">
			<ItemContent>
				<ItemTitle>{label}</ItemTitle>
			</ItemContent>
			{chosen && <ItemDescription>{<CheckIcon />}</ItemDescription>}
		</Item>
	);
}

export function QuizAnswerCard({ message }: { message: QuizAnswerMessage }) {
	const { data: questions, isPending } = useQuery(
		api.core.quiz.get.queryOptions({
			input: { lessonId: message.lessonId, quizIds: [message.questionId] },
		}),
	);

	if (isPending) return <Skeleton lines={1} className="w-full" />;

	const question = questions?.[0];
	if (!question) return null;

	const choices = question.type === "choices" ? question.choices : [];
	const options = question.type === "options" ? question.options : [];
	const pickedChoices =
		question.type === "choices" && Array.isArray(message.anwser)
			? message.anwser
			: [];
	const pickedOption =
		question.type === "options" && typeof message.anwser === "string"
			? message.anwser
			: "";

	return (
		<ItemGroup>
			<Item variant="outline" size="sm">
				<ItemContent>
					<ItemTitle>{question.question}</ItemTitle>
					<ItemDescription>
						{question.type === "text"
							? message.anwser
							: "Answered by the student."}
					</ItemDescription>
				</ItemContent>
			</Item>
			{choices.map((choice) => (
				<AnswerCheck
					key={choice}
					chosen={pickedChoices.includes(choice)}
					label={choice}
				/>
			))}
			{options.map((option) => (
				<AnswerCheck
					key={option}
					chosen={pickedOption === option}
					label={option}
				/>
			))}
		</ItemGroup>
	);
}
