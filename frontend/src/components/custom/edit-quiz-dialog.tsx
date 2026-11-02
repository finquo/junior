"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { type Quiz, quizZod } from "backend/config";
import { CheckIcon, PlusIcon, Trash2Icon } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { sileo as toast } from "sileo";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { api, refetchAPIs } from "@/hooks/api";

const emptyQuiz = (type: Quiz["type"], question: string, id: string): Quiz => {
	if (type === "choices") {
		return { id, type, question, choices: [], anwser: [] };
	}
	if (type === "options") {
		return { id, type, question, options: [], anwser: "" };
	}
	return { id, type, question, anwser: "" };
};

export function EditQuizDialog({
	lessonId,
	quiz,
	children,
}: {
	lessonId: string;
	quiz: Quiz;
	children: React.ReactElement;
}) {
	const [open, setOpen] = useState(false);

	const update = useMutation(
		api.core.lesson.updateQuiz.mutationOptions({
			onSuccess: () => {
				refetchAPIs([
					api.core.lesson.get.queryKey({ input: { id: lessonId } }),
				]);
				setOpen(false);
				toast.success({ title: "Quiz question updated" });
			},
		}),
	);
	const isPending = update.isPending;

	const form = useForm({
		defaultValues: quiz,
		validators: {
			onSubmit: quizZod,
		},
		onSubmit: async ({ value }) => {
			await update.mutateAsync({ id: lessonId, quiz: value });
		},
	});

	const handleOpenChange = (next: boolean) => {
		setOpen(next);
		if (!next) return;
		form.reset(quiz);
	};

	const changeType = (next: Quiz["type"]) => {
		const question = form.getFieldValue("question") ?? "";
		const id = form.getFieldValue("id") ?? "";
		form.reset(emptyQuiz(next, question, id));
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle>Edit Quiz Question</DialogTitle>
					<DialogDescription>
						Update the question, type, or answer key.
					</DialogDescription>
				</DialogHeader>

				<form
					onSubmit={(event) => {
						event.preventDefault();
						event.stopPropagation();
						form.handleSubmit();
					}}
				>
					<FieldGroup>
						<form.Field
							name="question"
							children={(field) => (
								<Field>
									<FieldLabel htmlFor={field.name}>Question</FieldLabel>
									<Input
										id={field.name}
										name={field.name}
										placeholder="What is the main idea of this lesson?"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(event) => field.handleChange(event.target.value)}
										disabled={isPending}
									/>
								</Field>
							)}
						/>

						<form.Subscribe selector={(state) => state.values.type}>
							{(type) => (
								<Tabs
									value={type}
									onValueChange={(value) => changeType(value as Quiz["type"])}
								>
									<TabsList>
										<TabsTrigger value="choices">Choices</TabsTrigger>
										<TabsTrigger value="options">Options</TabsTrigger>
										<TabsTrigger value="text">Text</TabsTrigger>
									</TabsList>

									<TabsContent value="choices">
										<form.Field
											name="choices"
											mode="array"
											children={(field) => {
												const choices = field.state.value ?? [];
												return (
													<FieldGroup>
														<FieldDescription>
															Check every choice that counts as a correct
															answer.
														</FieldDescription>
														{choices.map((choice, index) => (
															<Field key={index as number}>
																<FieldLabel htmlFor={`choice-${index}`}>
																	Choice {index + 1}
																</FieldLabel>
																<InputGroup>
																	<InputGroupInput
																		id={`choice-${index}`}
																		value={choice}
																		onChange={(event) => {
																			const next = event.target.value;
																			const anwsers =
																				form.getFieldValue("anwser");
																			if (
																				Array.isArray(anwsers) &&
																				anwsers.includes(choice)
																			) {
																				form.setFieldValue(
																					"anwser",
																					anwsers.map((anwser) =>
																						anwser === choice ? next : anwser,
																					),
																				);
																			}
																			field.replaceValue(index, next);
																		}}
																		disabled={isPending}
																	/>
																	<InputGroupAddon align="inline-end">
																		<form.Field
																			name="anwser"
																			children={(anwserField) => {
																				const anwsers = Array.isArray(
																					anwserField.state.value,
																				)
																					? anwserField.state.value
																					: [];
																				return (
																					<Checkbox
																						checked={anwsers.includes(choice)}
																						onCheckedChange={(checked) => {
																							if (checked === true) {
																								anwserField.handleChange([
																									...anwsers,
																									choice,
																								]);
																								return;
																							}
																							anwserField.handleChange(
																								anwsers.filter(
																									(anwser) => anwser !== choice,
																								),
																							);
																						}}
																						disabled={
																							isPending || !choice.trim()
																						}
																					/>
																				);
																			}}
																		/>
																		<Button
																			type="button"
																			variant="ghost"
																			size="icon-sm"
																			onClick={() => {
																				const anwsers =
																					form.getFieldValue("anwser");
																				if (
																					Array.isArray(anwsers) &&
																					anwsers.includes(choice)
																				) {
																					form.setFieldValue(
																						"anwser",
																						anwsers.filter(
																							(anwser) => anwser !== choice,
																						),
																					);
																				}
																				field.removeValue(index);
																			}}
																			disabled={isPending}
																		>
																			<Trash2Icon />
																		</Button>
																	</InputGroupAddon>
																</InputGroup>
															</Field>
														))}
														<Button
															type="button"
															variant="outline"
															size="sm"
															onClick={() => field.pushValue("")}
															disabled={isPending}
														>
															<PlusIcon />
															Add Choice
														</Button>
													</FieldGroup>
												);
											}}
										/>
									</TabsContent>

									<TabsContent value="options">
										<form.Field
											name="options"
											mode="array"
											children={(field) => {
												const options = field.state.value ?? [];
												return (
													<FieldGroup>
														<FieldDescription>
															Check the single correct option.
														</FieldDescription>
														{options.map((option, index) => (
															<Field key={index as number}>
																<FieldLabel htmlFor={`option-${index}`}>
																	Option {index + 1}
																</FieldLabel>
																<InputGroup>
																	<InputGroupInput
																		id={`option-${index}`}
																		value={option}
																		onChange={(event) => {
																			const next = event.target.value;
																			if (
																				form.getFieldValue("anwser") === option
																			) {
																				form.setFieldValue("anwser", next);
																			}
																			field.replaceValue(index, next);
																		}}
																		disabled={isPending}
																	/>
																	<InputGroupAddon align="inline-end">
																		<form.Field
																			name="anwser"
																			children={(anwserField) => (
																				<Checkbox
																					checked={
																						anwserField.state.value ===
																							option && option !== ""
																					}
																					onCheckedChange={(checked) =>
																						anwserField.handleChange(
																							checked === true ? option : "",
																						)
																					}
																					disabled={isPending || !option.trim()}
																				/>
																			)}
																		/>
																		<Button
																			type="button"
																			variant="ghost"
																			size="icon-sm"
																			onClick={() => {
																				if (
																					form.getFieldValue("anwser") ===
																					option
																				) {
																					form.setFieldValue("anwser", "");
																				}
																				field.removeValue(index);
																			}}
																			disabled={isPending}
																		>
																			<Trash2Icon />
																		</Button>
																	</InputGroupAddon>
																</InputGroup>
															</Field>
														))}
														<Button
															type="button"
															variant="outline"
															size="sm"
															onClick={() => field.pushValue("")}
															disabled={isPending}
														>
															<PlusIcon />
															Add Option
														</Button>
													</FieldGroup>
												);
											}}
										/>
									</TabsContent>

									<TabsContent value="text">
										<form.Field
											name="anwser"
											children={(field) => {
												const anwser = field.state.value;
												const value = typeof anwser === "string" ? anwser : "";
												return (
													<Field>
														<FieldLabel htmlFor={field.name}>
															Correct Answer
														</FieldLabel>
														<Textarea
															id={field.name}
															name={field.name}
															placeholder="The expected answer for this question"
															value={value}
															onBlur={field.handleBlur}
															onChange={(event) =>
																field.handleChange(event.target.value)
															}
															disabled={isPending}
														/>
														<FieldDescription>
															Students type their answer in free text.
														</FieldDescription>
													</Field>
												);
											}}
										/>
									</TabsContent>
								</Tabs>
							)}
						</form.Subscribe>

						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => setOpen(false)}
								disabled={isPending}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={isPending}>
								{isPending ? <Spinner /> : <CheckIcon />}
								Save Changes
							</Button>
						</DialogFooter>
					</FieldGroup>
				</form>
			</DialogContent>
		</Dialog>
	);
}
