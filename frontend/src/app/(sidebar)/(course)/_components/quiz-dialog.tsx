"use client";

import { useForm } from "@tanstack/react-form";
import { type Quiz, quizZod } from "backend/config";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

const emptyQuiz = (type: Quiz["type"], question: string): Quiz => {
	if (type === "choices") {
		return { id: "", type, question, choices: [], anwser: [] };
	}
	if (type === "options") {
		return { id: "", type, question, options: [], anwser: "" };
	}
	return { id: "", type, question, anwser: "" };
};

export function QuizDialog({
	onAdd,
	children,
}: {
	onAdd: (quiz: Quiz) => void;
	children: React.ReactElement;
}) {
	const [open, setOpen] = useState(false);

	const form = useForm({
		defaultValues: emptyQuiz("choices", ""),
		validators: {
			onSubmit: quizZod,
		},
		onSubmit: async ({ value }) => {
			onAdd({ ...value, id: crypto.randomUUID() });
			setOpen(false);
			form.reset();
		},
	});

	const changeType = (next: Quiz["type"]) => {
		const question = form.getFieldValue("question") ?? "";
		form.reset(emptyQuiz(next, question));
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Add Quiz Question</DialogTitle>
					<DialogDescription>
						Choose a question type and fill in the answer key.
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
										placeholder="What is the main idea of this module?"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(event) => field.handleChange(event.target.value)}
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
																						disabled={!choice.trim()}
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
																					disabled={!option.trim()}
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
							>
								Cancel
							</Button>
							<Button type="submit">
								<PlusIcon />
								Add Question
							</Button>
						</DialogFooter>
					</FieldGroup>
				</form>
			</DialogContent>
		</Dialog>
	);
}
