"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { type Quiz, quizZod } from "backend/config";
import { InsertModuleSchema } from "backend/db";
import { PlusIcon, SaveIcon, Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { sileo as toast } from "sileo";
import type { z } from "zod";
import { CourseSelector } from "@/components/custom/course-selector";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerInner,
	DrawerTitle,
	DrawerTrigger,
} from "@/components/ui/drawer";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemGroup,
	ItemTitle,
} from "@/components/ui/item";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { api, refetchAPIs } from "@/hooks/api";
import type { API_Returns } from "@/lib/api";
import type { GetFormZod } from "@/lib/utils";
import { QuizDialog } from "./quiz-dialog";

type ModuleRecord = API_Returns["core"]["module"]["list"][number];

const moduleFormSchema = InsertModuleSchema.pick({
	name: true,
	description: true,
}).extend({ quiz: quizZod.array() });

function QuizItem({ quiz, onRemove }: { quiz: Quiz; onRemove: () => void }) {
	return (
		<Item variant="outline">
			<ItemContent>
				<ItemTitle>{quiz.question}</ItemTitle>
				<ItemDescription>{quiz.type}</ItemDescription>
			</ItemContent>
			<ItemActions>
				<Button variant="ghost" size="icon-sm" onClick={onRemove}>
					<Trash2Icon />
				</Button>
			</ItemActions>
		</Item>
	);
}

function ModuleFormContent({
	courseId,
	module,
	formId,
	footer,
	onSuccess,
}: {
	courseId: string;
	module?: ModuleRecord;
	formId: string;
	footer: (isPending: boolean) => React.ReactElement;
	onSuccess?: (moduleId?: string) => void;
}) {
	const invalidate = () => {
		refetchAPIs([
			api.core.module.list.queryKey({ input: { course: courseId } }),
			api.core.course.get.queryKey({ input: { id: courseId } }),
			api.core.module.listAll.queryKey(),
			api.sidebar.modules.queryKey(),
		]);
	};

	const create = useMutation(
		api.core.module.create.mutationOptions({
			onSuccess: (created) => {
				invalidate();
				toast.success({ title: "Module created" });
				onSuccess?.(created?.id);
			},
			onError: (err) => {
				toast.error({ title: err.message || "Failed to create module" });
			},
		}),
	);
	const update = useMutation(
		api.core.module.update.mutationOptions({
			onSuccess: () => {
				invalidate();
				toast.success({ title: "Module updated" });
				onSuccess?.(module?.id);
			},
			onError: (err) => {
				toast.error({ title: err.message || "Failed to update module" });
			},
		}),
	);

	const isPending = create.isPending || update.isPending;

	const form = useForm({
		defaultValues: {
			name: module?.name,
			description: module?.description ?? undefined,
			quiz: module?.quiz ?? [],
		} as z.infer<typeof moduleFormSchema>,
		validators: {
			onSubmit: moduleFormSchema as GetFormZod<typeof moduleFormSchema>,
		},
		onSubmit: async ({ value }) => {
			const payload = {
				name: value.name.trim(),
				description: value.description?.trim() || null,
				quiz: value.quiz,
			};

			if (module) {
				await update.mutateAsync({ id: module.id, ...payload });
				return;
			}
			await create.mutateAsync({ course: courseId, ...payload });
		},
	});

	return (
		<>
			<form
				id={formId}
				onSubmit={(event) => {
					event.preventDefault();
					event.stopPropagation();
					form.handleSubmit();
				}}
			>
				<FieldGroup>
					<form.Field
						name="name"
						children={(field) => {
							const isInvalid =
								field.state.meta.isTouched && !field.state.meta.isValid;
							return (
								<Field data-invalid={isInvalid}>
									<FieldLabel htmlFor={field.name}>Module Name</FieldLabel>
									<Input
										id={field.name}
										name={field.name}
										placeholder="Introduction to the markets"
										value={field.state.value ?? ""}
										onBlur={field.handleBlur}
										onChange={(event) => field.handleChange(event.target.value)}
										aria-invalid={isInvalid}
										disabled={isPending}
									/>
									{isInvalid && (
										<FieldError
											errors={field.state.meta.errors.map((err) =>
												typeof err === "string" ? { message: err } : err,
											)}
										/>
									)}
								</Field>
							);
						}}
					/>

					<form.Field
						name="description"
						children={(field) => (
							<Field>
								<FieldLabel htmlFor={field.name}>Description</FieldLabel>
								<Textarea
									id={field.name}
									name={field.name}
									placeholder="What this module covers..."
									value={field.state.value ?? ""}
									onBlur={field.handleBlur}
									onChange={(event) =>
										field.handleChange(event.target.value || undefined)
									}
									disabled={isPending}
								/>
								<FieldDescription>Optional module summary.</FieldDescription>
							</Field>
						)}
					/>

					<form.Field
						name="quiz"
						mode="array"
						children={(field) => {
							const quiz = field.state.value ?? [];
							return (
								<FieldGroup>
									<FieldLabel>Quiz Questions</FieldLabel>
									<FieldDescription>
										Questions students answer after completing this module.
									</FieldDescription>
									{quiz.length === 0 ? (
										<Empty>
											<EmptyTitle>No quiz questions</EmptyTitle>
											<EmptyDescription>
												Add a question to build this module quiz.
											</EmptyDescription>
										</Empty>
									) : (
										quiz.map((question, index) => (
											<QuizItem
												key={question.id || String(index)}
												quiz={question}
												onRemove={() => field.removeValue(index)}
											/>
										))
									)}
									<QuizDialog onAdd={(question) => field.pushValue(question)}>
										<Button type="button" variant="outline" size="sm">
											<PlusIcon />
											Add Quiz Question
										</Button>
									</QuizDialog>
								</FieldGroup>
							);
						}}
					/>
				</FieldGroup>
			</form>
			{footer(isPending)}
		</>
	);
}

export function ModuleForm({
	courseId,
	module,
	onSuccess,
	children,
}: {
	courseId: string;
	module?: ModuleRecord;
	onSuccess?: (moduleId?: string) => void;
	children: React.ReactElement;
}) {
	const formId = `module-form-${module?.id ?? "new"}`;

	return (
		<Drawer>
			<DrawerTrigger asChild>{children}</DrawerTrigger>
			<DrawerContent>
				<DrawerHeader>
					<DrawerTitle>{module ? "Edit Module" : "Create Module"}</DrawerTitle>
					<DrawerDescription>
						Add module details and quiz questions.
					</DrawerDescription>
				</DrawerHeader>
				<DrawerInner>
					<ModuleFormContent
						courseId={courseId}
						module={module}
						formId={formId}
						onSuccess={onSuccess}
						footer={(isPending) => (
							<DrawerFooter>
								<DrawerClose asChild>
									<Button variant="outline" disabled={isPending}>
										Cancel
									</Button>
								</DrawerClose>
								<Button type="submit" form={formId} disabled={isPending}>
									{isPending ? (
										<Spinner />
									) : module ? (
										<SaveIcon />
									) : (
										<PlusIcon />
									)}
									{module ? "Save Changes" : "Create Module"}
								</Button>
							</DrawerFooter>
						)}
					/>
				</DrawerInner>
			</DrawerContent>
		</Drawer>
	);
}

export function ModuleCreateForm() {
	const router = useRouter();
	const [courseId, setCourseId] = useState<string>();

	return (
		<Card>
			<CardHeader>
				<CardTitle>Module Details</CardTitle>
				<CardDescription>
					Choose a course, then add module metadata and quiz questions.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<CourseSelector value={courseId} onValueChange={setCourseId} />
				{courseId && (
					<ModuleFormContent
						courseId={courseId}
						formId="module-form-new-page"
						onSuccess={(moduleId) => {
							if (moduleId) router.push(`/modules/${moduleId}` as "/");
						}}
						footer={(isPending) => (
							<CardFooter className="justify-end">
								<Button
									type="submit"
									form="module-form-new-page"
									disabled={isPending}
								>
									{isPending ? <Spinner /> : <PlusIcon />}
									Create Module
								</Button>
							</CardFooter>
						)}
					/>
				)}
			</CardContent>
		</Card>
	);
}

export function ModuleQuizList({ quiz }: { quiz: Quiz[] }) {
	if (quiz.length === 0) {
		return (
			<Empty>
				<EmptyTitle>No quiz questions</EmptyTitle>
				<EmptyDescription>
					Add questions when editing this module.
				</EmptyDescription>
			</Empty>
		);
	}

	return (
		<ItemGroup>
			{quiz.map((question, index) => (
				<Item key={question.id || index} variant="outline">
					<ItemContent>
						<ItemTitle>
							{index + 1}. {question.question}
						</ItemTitle>
						<ItemDescription className="capitalize">
							{question.type}
						</ItemDescription>
					</ItemContent>
				</Item>
			))}
		</ItemGroup>
	);
}
