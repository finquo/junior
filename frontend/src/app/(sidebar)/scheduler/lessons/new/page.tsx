"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { type LanguageCodes, LanguageCodeZod, Languages } from "backend/config";
import { BookOpenIcon } from "lucide-react";
import Link from "next/link";
import { sileo as toast } from "sileo";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { api, queryClient } from "@/hooks/api";
import type { GetFormZod } from "@/lib/utils";

const languageOptions = Object.entries(Languages);
const period = [30, 60, 120, 180];

const createLessonSchema = z.object({
	name: z.string().trim().min(1, "Lesson name is required"),
	description: z.string().optional(),
	language: LanguageCodeZod,
	period: z.number(),
});

export default function CreateLessonPage() {
	const { mutateAsync, isPending } = useMutation(
		api.core.lesson.create.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries();
				toast.success({ title: "Lesson created successfully" });
			},
			onError: (err) => {
				toast.error({ title: err.message || "Failed to create lesson" });
			},
		}),
	);

	const form = useForm({
		defaultValues: {
			name: "",
			description: "",
			language: "en-IN" as LanguageCodes,
			period: 60,
		} as z.infer<typeof createLessonSchema>,
		validators: {
			onSubmit: createLessonSchema as GetFormZod<typeof createLessonSchema>,
		},
		onSubmit: async ({ value }) => {
			await mutateAsync({
				name: value.name.trim(),
				description: value.description?.trim() || null,
				language: value.language,
				period: value.period,
			});
		},
	});

	return (
		<div className="mx-auto max-w-xl py-6">
			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
			>
				<Card>
					<CardHeader>
						<CardTitle className="text-xl">Create New Lesson</CardTitle>
						<CardDescription>
							Define lesson curriculum details, language, and duration.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<FieldGroup>
							<form.Field
								name="name"
								children={(field) => {
									const isInvalid =
										field.state.meta.isTouched && !field.state.meta.isValid;
									return (
										<Field data-invalid={isInvalid}>
											<FieldLabel htmlFor={field.name}>Lesson Name</FieldLabel>
											<Input
												id={field.name}
												name={field.name}
												placeholder="Introduction to Financial Literacy"
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
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
								children={(field) => {
									const isInvalid =
										field.state.meta.isTouched && !field.state.meta.isValid;
									return (
										<Field data-invalid={isInvalid}>
											<FieldLabel htmlFor={field.name}>Description</FieldLabel>
											<Textarea
												id={field.name}
												name={field.name}
												placeholder="Detailed overview of learning objectives, syllabus, and prerequisites..."
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
												aria-invalid={isInvalid}
												disabled={isPending}
											/>
											<FieldDescription>
												Optional summary describing the topics covered in this
												lesson.
											</FieldDescription>
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
								name="language"
								children={(field) => {
									const isInvalid =
										field.state.meta.isTouched && !field.state.meta.isValid;
									return (
										<Field data-invalid={isInvalid}>
											<FieldLabel htmlFor={field.name}>Language</FieldLabel>
											<Select
												items={Languages}
												value={field.state.value}
												disabled={isPending}
												onValueChange={(val) => {
													if (val) field.handleChange(val as LanguageCodes);
												}}
											>
												<SelectTrigger id={field.name}>
													<SelectValue placeholder="Select language" />
												</SelectTrigger>
												<SelectContent>
													<SelectGroup>
														{languageOptions.map(([value, label]) => (
															<SelectItem key={value} value={value}>
																{label}
															</SelectItem>
														))}
													</SelectGroup>
												</SelectContent>
											</Select>
											<FieldDescription>
												Teaching language used for this lesson.
											</FieldDescription>
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
								name="period"
								children={(field) => {
									const isInvalid =
										field.state.meta.isTouched && !field.state.meta.isValid;
									return (
										<Field data-invalid={isInvalid}>
											<FieldLabel>Duration (Minutes)</FieldLabel>
											<ButtonGroup>
												{period.map((val) => (
													<Button
														key={val}
														type="button"
														variant={
															field.state.value === val ? "default" : "outline"
														}
														onClick={() => field.handleChange(val)}
														disabled={isPending}
													>
														{val} mins
													</Button>
												))}
											</ButtonGroup>
											<FieldDescription>
												Select the lesson duration in minutes.
											</FieldDescription>
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
						</FieldGroup>
					</CardContent>
					<CardFooter className="flex justify-end gap-3 pt-6">
						<Button type="submit" disabled={isPending}>
							{isPending ? <Spinner /> : <BookOpenIcon />}
							Create Lesson
						</Button>
					</CardFooter>
				</Card>
			</form>
		</div>
	);
}
