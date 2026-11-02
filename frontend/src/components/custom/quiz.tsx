"use client";

import { useMutation } from "@tanstack/react-query";
import type { Quiz } from "backend/config";
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
	ItemGroup,
	ItemMedia,
	ItemTitle,
} from "@/components/ui/item";
import { Spinner } from "@/components/ui/spinner";
import { api, refetchAPIs } from "@/hooks/api";
import { RenderWhenRole } from "@/hooks/role";

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
		api.core.lesson.deleteQuiz.mutationOptions({
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
}: {
	quiz: Quiz[];
	lessonId: string;
	editable?: boolean;
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
					<AccordionTrigger className="decoration-0">
						<Badge className="min-w-16 capitalize">{question.type}</Badge>
						{index + 1}. {question.question}
					</AccordionTrigger>
					<AccordionContent className="space-y-2">
						{editable && (
							<RenderWhenRole role={["admin", "scheduler"]}>
								<ButtonGroup>
									<EditQuizDialog lessonId={lessonId} quiz={question}>
										<Button variant="outline" size="sm">
											<PenIcon />
											Edit
										</Button>
									</EditQuizDialog>
									<DeleteQuizButton lessonId={lessonId} quizId={question.id} />
								</ButtonGroup>
							</RenderWhenRole>
						)}

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
