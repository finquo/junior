"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { CircleAlertIcon, RefreshCwIcon } from "lucide-react";
import { useParams } from "next/navigation";
import { AnswerStatusBadge, QuizAnswerReview } from "@/components/custom/quiz";
import Loader from "@/components/loader";
import {
	Frame,
	FrameDescription,
	FrameHeader,
	FramePanel,
	FrameTitle,
} from "@/components/reui/frame";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { api, refetchAPIs } from "@/hooks/api";
import { RenderWhenRole } from "@/hooks/role";
import { FetchUser } from "@/hooks/user";
import type { API_Returns } from "@/lib/api";

type AnswerRow = API_Returns["core"]["quiz"]["studentAnswers"][number];

const answersQueryKey = (studentId: string) =>
	api.core.quiz.studentAnswers.queryKey({ input: { studentId } });

function AnswerActions({
	studentId,
	lessonId,
	answer,
}: {
	studentId: string;
	lessonId: string;
	answer: AnswerRow;
}) {
	const questionId = answer.answer?.questionId;
	const { mutate: grade, isPending: isGrading } = useMutation(
		api.core.quiz.grade.mutationOptions({
			onSuccess: () => {
				refetchAPIs([answersQueryKey(studentId)]);
			},
		}),
	);
	const { mutate: retake, isPending: isRetaking } = useMutation(
		api.core.quiz.retake.mutationOptions({
			onSuccess: () => {
				refetchAPIs([answersQueryKey(studentId)]);
			},
		}),
	);

	if (!questionId) return null;

	return (
		<ButtonGroup>
			<Button
				variant="outline"
				size="sm"
				onClick={() =>
					grade({
						studentId,
						lessonId,
						answerId: answer.id,
						status: "correct",
					})
				}
				disabled={isGrading || answer.status === "correct"}
			>
				<CircleAlertIcon />
				Correct
			</Button>
			<Button
				variant="outline"
				size="sm"
				onClick={() =>
					grade({
						studentId,
						lessonId,
						answerId: answer.id,
						status: "partially_correct",
					})
				}
				disabled={isGrading || answer.status === "partially_correct"}
			>
				<CircleAlertIcon />
				Partial
			</Button>
			<Button
				variant="outline"
				size="sm"
				onClick={() =>
					grade({
						studentId,
						lessonId,
						answerId: answer.id,
						status: "wrong",
					})
				}
				disabled={isGrading || answer.status === "wrong"}
			>
				<CircleAlertIcon />
				Wrong
			</Button>
			<Button
				variant="outline"
				size="sm"
				onClick={() =>
					retake({ studentId, lessonId, questionIds: [questionId] })
				}
				disabled={isRetaking}
			>
				<RefreshCwIcon />
				Retake
			</Button>
		</ButtonGroup>
	);
}

function RetakeWrongButton({
	studentId,
	lessonId,
	answers,
}: {
	studentId: string;
	lessonId: string;
	answers: AnswerRow[];
}) {
	const wrongQuestionIds = answers
		.filter(
			(row) =>
				row.answer &&
				(row.status === "wrong" || row.status === "partially_correct"),
		)
		.map((row) => row.answer?.questionId)
		.filter((id): id is string => Boolean(id));

	const { mutate, isPending } = useMutation(
		api.core.quiz.retake.mutationOptions({
			onSuccess: () => {
				refetchAPIs([answersQueryKey(studentId)]);
			},
		}),
	);

	return (
		<Button
			variant="outline"
			size="sm"
			onClick={() =>
				mutate({ studentId, lessonId, questionIds: wrongQuestionIds })
			}
			disabled={isPending || wrongQuestionIds.length === 0}
		>
			<RefreshCwIcon />
			Retake Wrong ({wrongQuestionIds.length})
		</Button>
	);
}

function StudentAnwsers({ studentId }: { studentId: string }) {
	const {
		data: student,
		isPending,
		isError,
	} = useQuery(api.core.student.get.queryOptions({ input: { id: studentId } }));
	const { data: answers = [] } = useQuery(
		api.core.quiz.studentAnswers.queryOptions({ input: { studentId } }),
	);

	if (isPending) {
		return <Loader />;
	}

	if (isError || !student) {
		return (
			<Alert variant="destructive">
				<AlertTitle>Student Not Found</AlertTitle>
				<AlertDescription>
					The requested student profile could not be loaded or does not exist.
				</AlertDescription>
			</Alert>
		);
	}

	const lessons = Object.values(
		answers.reduce<
			Record<
				string,
				{
					lessonId: string;
					lessonName: string;
					quiz: AnswerRow["quiz"];
					rows: AnswerRow[];
				}
			>
		>((acc, row) => {
			acc[row.lessonId] ??= {
				lessonId: row.lessonId,
				lessonName: row.lessonName,
				quiz: row.quiz,
				rows: [],
			};
			acc[row.lessonId].rows.push(row);
			return acc;
		}, {}),
	);

	return (
		<Frame>
			<FrameHeader>
				<FrameTitle>Quiz Answers</FrameTitle>
				<FrameDescription>
					<FetchUser id={studentId}>
						{(user) => `Quiz attempts by ${user.name}, grouped by lesson.`}
					</FetchUser>
				</FrameDescription>
			</FrameHeader>
			<FramePanel>
				{lessons.length === 0 ? (
					<Empty>
						<EmptyHeader>
							<EmptyMedia variant="icon">
								<CircleAlertIcon />
							</EmptyMedia>
							<EmptyTitle>No quiz answers yet</EmptyTitle>
							<EmptyDescription>
								This student has not answered any quizzes.
							</EmptyDescription>
						</EmptyHeader>
					</Empty>
				) : (
					<Accordion
						type="multiple"
						defaultValue={lessons.map((l) => l.lessonId)}
					>
						{lessons.map((lesson) => (
							<AccordionItem key={lesson.lessonId} value={lesson.lessonId}>
								<AccordionTrigger className="decoration-0">
									<Badge variant="outline">{lesson.rows.length}</Badge>
									{lesson.lessonName}
								</AccordionTrigger>
								<AccordionContent className="space-y-2">
									<RenderWhenRole role={["admin", "scheduler", "teacher"]}>
										<RetakeWrongButton
											studentId={studentId}
											lessonId={lesson.lessonId}
											answers={lesson.rows}
										/>
									</RenderWhenRole>
									{lesson.rows.map((row) => {
										const question = (lesson.quiz ?? []).find(
											(q) => q.id === row.answer?.questionId,
										);
										if (!question || !row.answer) return null;
										return (
											<Accordion key={row.id} type="single" collapsible>
												<AccordionItem value={row.id}>
													<AccordionTrigger className="decoration-0">
														<AnswerStatusBadge status={row.status} />
														{question.question}
													</AccordionTrigger>
													<AccordionContent className="space-y-2">
														<QuizAnswerReview
															question={question}
															answer={row.answer}
														/>
														<RenderWhenRole
															role={["admin", "scheduler", "teacher"]}
														>
															<AnswerActions
																studentId={studentId}
																lessonId={lesson.lessonId}
																answer={row}
															/>
														</RenderWhenRole>
													</AccordionContent>
												</AccordionItem>
											</Accordion>
										);
									})}
								</AccordionContent>
							</AccordionItem>
						))}
					</Accordion>
				)}
			</FramePanel>
		</Frame>
	);
}

export default function Page() {
	const params = useParams<{ id: string }>();
	const studentId = params?.id;

	if (!studentId) {
		return (
			<Alert variant="destructive">
				<AlertTitle>Invalid Student ID</AlertTitle>
				<AlertDescription>
					No student identifier was found in the URL.
				</AlertDescription>
			</Alert>
		);
	}

	return <StudentAnwsers studentId={studentId} />;
}
