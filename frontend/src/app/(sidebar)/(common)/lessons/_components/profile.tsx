"use client";

import { programs } from "backend/config";
import { langFlag, langName } from "language-emoji";
import {
	BookOpenIcon,
	CalendarIcon,
	CheckIcon,
	ClockIcon,
	GraduationCapIcon,
	LanguagesIcon,
	ListChecksIcon,
	PenIcon,
} from "lucide-react";
import { getDurationFromInterval } from "utils";
import { CopyButton } from "@/components/copy";
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
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RenderWhenRole } from "@/hooks/role";
import type { API_Returns } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { EditLessonDrawer } from "./edit-drawer";

type LessonData = NonNullable<API_Returns["core"]["lesson"]["get"]>;

function AnswerRow({ label, correct }: { label: string; correct: boolean }) {
	return (
		<Item variant={correct ? "muted" : "outline"}>
			<ItemMedia variant="icon">
				{correct ? <CheckIcon /> : <ListChecksIcon />}
			</ItemMedia>
			<ItemContent>
				<ItemTitle>{label}</ItemTitle>
			</ItemContent>
			{correct && <ColorBadge variant="success">Correct</ColorBadge>}
		</Item>
	);
}

export function LessonProfile({ data }: { data: LessonData }) {
	const quiz = data.quiz ?? [];
	const program = programs.find((p) => p.id === data.program);

	return (
		<Card>
			<CardHeader>
				<CardTitle>{data.name}</CardTitle>
				<CardDescription>
					{data.description ?? "No description provided for this lesson."}
				</CardDescription>
				<Badge variant="secondary">
					{langFlag(data.language)} {langName(data.language)}
				</Badge>
				<ColorBadge variant="info">{program?.name ?? data.program}</ColorBadge>
				<Badge variant="outline">
					{data.period ? `${getDurationFromInterval(data.period)} mins` : "—"}
				</Badge>

				<CardAction>
					<ButtonGroup>
						<CopyButton
							text={() => data.id}
							label="Lesson ID"
							variant="outline"
							size="sm"
						/>
						<RenderWhenRole role={["admin", "scheduler"]}>
							<EditLessonDrawer lesson={data}>
								<Button variant="outline" size="sm">
									<PenIcon />
									Edit
								</Button>
							</EditLessonDrawer>
						</RenderWhenRole>
					</ButtonGroup>
				</CardAction>
			</CardHeader>

			<CardContent>
				<Tabs defaultValue="overview">
					<TabsList>
						<TabsTrigger value="overview">
							<BookOpenIcon />
							Overview
						</TabsTrigger>
						<TabsTrigger value="quiz">
							<ListChecksIcon />
							Quiz
						</TabsTrigger>
					</TabsList>

					<TabsContent value="overview" className="flex flex-col gap-4">
						<Card size="sm">
							<CardHeader>
								<CardTitle>Lesson Details</CardTitle>
								<CardDescription>
									Curriculum metadata for this lesson.
								</CardDescription>
							</CardHeader>
							<CardContent>
								<ItemGroup>
									<Item variant="muted">
										<ItemMedia variant="icon">
											<LanguagesIcon />
										</ItemMedia>
										<ItemContent>
											<ItemTitle>Language</ItemTitle>
											<ItemDescription>
												{langName(data.language)}
											</ItemDescription>
										</ItemContent>
									</Item>
									<Item variant="muted">
										<ItemMedia variant="icon">
											<GraduationCapIcon />
										</ItemMedia>
										<ItemContent>
											<ItemTitle>Program</ItemTitle>
											<ItemDescription>
												{program?.name ?? data.program}
											</ItemDescription>
										</ItemContent>
									</Item>
									<Item variant="muted">
										<ItemMedia variant="icon">
											<ClockIcon />
										</ItemMedia>
										<ItemContent>
											<ItemTitle>Duration</ItemTitle>
											<ItemDescription>
												{data.period
													? `${getDurationFromInterval(data.period)} minutes`
													: "—"}
											</ItemDescription>
										</ItemContent>
									</Item>
									<Item variant="muted">
										<ItemMedia variant="icon">
											<ListChecksIcon />
										</ItemMedia>
										<ItemContent>
											<ItemTitle>Quiz Questions</ItemTitle>
											<ItemDescription>{quiz.length}</ItemDescription>
										</ItemContent>
									</Item>
									<Item variant="muted">
										<ItemMedia variant="icon">
											<CalendarIcon />
										</ItemMedia>
										<ItemContent>
											<ItemTitle>Created</ItemTitle>
											<ItemDescription>
												{formatDate(data.createdAt)}
											</ItemDescription>
										</ItemContent>
									</Item>
									<Item variant="muted">
										<ItemMedia variant="icon">
											<CalendarIcon />
										</ItemMedia>
										<ItemContent>
											<ItemTitle>Last Updated</ItemTitle>
											<ItemDescription>
												{formatDate(data.updatedAt)}
											</ItemDescription>
										</ItemContent>
									</Item>
								</ItemGroup>
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="quiz" className="flex flex-col gap-4">
						<Card size="sm">
							<CardHeader>
								<CardTitle>Quiz</CardTitle>
								<CardDescription>
									{quiz.length > 0
										? `${quiz.length} question${quiz.length === 1 ? "" : "s"} attached to this lesson.`
										: "No quiz questions attached to this lesson."}
								</CardDescription>
							</CardHeader>
							<CardContent>
								{quiz.length === 0 ? (
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
								) : (
									<Accordion type="multiple">
										{quiz.map((question, idx) => (
											<AccordionItem
												key={idx as number}
												value={`question-${idx}`}
											>
												<AccordionTrigger>
													{idx + 1}. {question.question}
												</AccordionTrigger>
												<AccordionContent className="flex flex-col gap-2">
													<Badge variant="outline" className="capitalize">
														{question.type}
													</Badge>

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
								)}
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>
			</CardContent>
		</Card>
	);
}
