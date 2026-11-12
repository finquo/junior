"use client";

import { useMutation } from "@tanstack/react-query";
import type { Anwser, Quiz } from "backend/config";
import {
	CheckIcon,
	ListChecksIcon,
	PenIcon,
	Trash2Icon,
	XIcon,
} from "lucide-react";
import { sileo as toast } from "sileo";
import { EditQuizDialog } from "@/components/custom/edit-quiz-dialog";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge, ColorBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import {
	Item,
	ItemContent,
	ItemDescription,
	ItemGroup,
	ItemMedia,
	ItemTitle,
} from "@/components/ui/item";
import { Spinner } from "@/components/ui/spinner";
import { api, refetchAPIs } from "@/hooks/api";
import { RenderWhenRole } from "@/hooks/role";
import type { API_Returns } from "@/lib/api";

type AnswerStatus =
	API_Returns["core"]["quiz"]["studentAnswers"][number]["status"];

const answerStatusVariants: Record<
	AnswerStatus,
	| "default"
	| "secondary"
	| "success"
	| "warning"
	| "destructive"
	| "info"
	| "outline"
> = {
	pending: "outline",
	answered: "secondary",
	correct: "success",
	partially_correct: "warning",
	wrong: "destructive",
	retake: "info",
};

export function AnswerStatusBadge({ status }: { status: AnswerStatus }) {
	return (
		<ColorBadge variant={answerStatusVariants[status]}>
			{status === "partially_correct" ? "Partially Correct" : status}
		</ColorBadge>
	);
}

/**
 * Renders the correct answer and the student's answer for one question.
 */
export function QuizAnswerReview({
	question,
	answer,
}: {
	question: Quiz;
	answer: Anwser;
}) {
	if (question.type === "text") {
		return (
			<ItemGroup>
				<Item variant="secondary">
					<ItemMedia variant="icon">
						<CheckIcon />
					</ItemMedia>
					<ItemContent>
						<ItemTitle>{question.anwser}</ItemTitle>
						<ItemDescription>Correct answer</ItemDescription>
					</ItemContent>
				</Item>
				<Item variant="outline">
					<ItemMedia variant="icon">
						<PenIcon />
					</ItemMedia>
					<ItemContent>
						<ItemTitle>{answer.anwser || "No answer given"}</ItemTitle>
						<ItemDescription>Student's answer</ItemDescription>
					</ItemContent>
				</Item>
			</ItemGroup>
		);
	}

	const choices =
		question.type === "choices" ? question.choices : question.options;
	const correctChoices =
		question.type === "choices" ? question.anwser : [question.anwser];
	const studentChoices =
		answer.type === "choices" ? answer.anwser : [answer.anwser];

	return (
		<ItemGroup>
			{choices.map((choice) => {
				const isCorrect = correctChoices.includes(choice);
				const isPicked = studentChoices.includes(choice);
				return (
					<Item key={choice} variant={isCorrect ? "secondary" : "outline"}>
						<ItemMedia variant="icon">
							{isCorrect ? <CheckIcon /> : <XIcon />}
						</ItemMedia>
						<ItemContent>
							<ItemTitle>{choice}</ItemTitle>
						</ItemContent>
						{isPicked && (
							<ColorBadge variant="info">Student's answer</ColorBadge>
						)}
						{isCorrect && <ColorBadge variant="success">Correct</ColorBadge>}
					</Item>
				);
			})}
		</ItemGroup>
	);
}

function AnswerRow({ label, correct }: { label: string; correct: boolean }) {
	return (
		<Item variant={correct ? "secondary" : "outline"}>
			<ItemMedia variant="icon">
				{correct ? <CheckIcon /> : <XIcon />}
			</ItemMedia>
			<ItemContent>
				<ItemTitle>{label}</ItemTitle>
			</ItemContent>
			{correct && <ColorBadge variant="success">Correct</ColorBadge>}
		</Item>
	);
}

function DeleteQuizButton({
	lessonId,
	quizId,
}: {
	lessonId: string;
	quizId: string;
}) {
	const { mutate, isPending } = useMutation(
		api.core.quiz.delete.mutationOptions({
			onSuccess: () => {
				refetchAPIs([
					api.core.lesson.get.queryKey({ input: { id: lessonId } }),
				]);
				toast.success({ title: "Quiz question deleted" });
			},
		}),
	);

	return (
		<Button
			variant="destructive"
			size="sm"
			onClick={() => mutate({ id: lessonId, quizId })}
			disabled={isPending}
		>
			{isPending ? <Spinner /> : <Trash2Icon />}
			Delete
		</Button>
	);
}

export function QuizList({
	quiz,
	lessonId,
	editable,
	children,
	selector,
}: {
	quiz: Quiz[];
	lessonId: string;
	editable?: boolean;
	children?: (question: Quiz) => React.ReactNode;
	selector?: (question: Quiz) => React.ReactNode;
}) {
	if (quiz.length === 0) {
		return (
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<ListChecksIcon />
					</EmptyMedia>
					<EmptyTitle>No quiz yet</EmptyTitle>
					<EmptyDescription>
						Add questions to assess student understanding.
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		);
	}

	const expandedItems = editable
		? quiz.map((question) => question.id)
		: undefined;

	return (
		<Accordion type="multiple" defaultValue={expandedItems}>
			{quiz.map((question, index) => (
				<AccordionItem key={question.id} value={question.id}>
					<AccordionTrigger
						secondary={
							editable ? (
								<RenderWhenRole role={["admin", "scheduler"]}>
									<ButtonGroup>
										<EditQuizDialog lessonId={lessonId} quiz={question}>
											<Button variant="outline" size="sm">
												<PenIcon />
												Edit
											</Button>
										</EditQuizDialog>
										<DeleteQuizButton
											lessonId={lessonId}
											quizId={question.id}
										/>
									</ButtonGroup>
								</RenderWhenRole>
							) : (
								selector?.(question)
							)
						}
						className="decoration-0"
					>
						<Badge className="min-w-16 capitalize">{question.type}</Badge>
						{index + 1}. {question.question}
					</AccordionTrigger>
					<AccordionContent className="space-y-2">
						{children?.(question)}

						{question.type === "choices" && (
							<ItemGroup>
								{question.choices.map((choice) => (
									<AnswerRow
										key={choice}
										label={choice}
										correct={question.anwser.includes(choice)}
									/>
								))}
							</ItemGroup>
						)}

						{question.type === "options" && (
							<ItemGroup>
								{question.options.map((option) => (
									<AnswerRow
										key={option}
										label={option}
										correct={question.anwser === option}
									/>
								))}
							</ItemGroup>
						)}

						{question.type === "text" && (
							<ItemGroup>
								<AnswerRow label={question.anwser} correct />
							</ItemGroup>
						)}
					</AccordionContent>
				</AccordionItem>
			))}
		</Accordion>
	);
}
