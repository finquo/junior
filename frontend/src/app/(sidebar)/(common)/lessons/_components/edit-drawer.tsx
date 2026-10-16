"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import type React from "react";
import { useState } from "react";
import { sileo as toast } from "sileo";
import {
	getDurationFromInterval,
	type LanguageCodes,
	LanguageCodeZod,
	Languages,
} from "utils";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
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
import { api, refetchAPIs } from "@/hooks/api";
import type { API_Returns } from "@/lib/api";
import type { GetFormZod } from "@/lib/utils";

type LessonData = NonNullable<API_Returns["core"]["lesson"]["get"]>;

const languageOptions = Object.entries(Languages);
const period = [30, 60, 120, 180];

const lessonUpdateFormSchema = z.object({
	id: z.string(),
	name: z.string().trim().min(1, "Lesson name is required"),
	description: z.string().nullable(),
	language: LanguageCodeZod,
	program: z.string(),
	period: z.number(),
});

type LessonEditableData = z.infer<typeof lessonUpdateFormSchema>;

export function EditLessonDrawer({
	lesson,
	children,
}: {
	lesson: LessonData;
	children: React.ReactElement;
}) {
	const [open, setOpen] = useState(false);
	const { data: programs = [] } = useQuery(
		api.core.program.list.queryOptions(),
	);

	const { mutateAsync, isPending } = useMutation(
		api.core.lesson.update.mutationOptions({
			onSuccess: () => {
				refetchAPIs([
					api.core.lesson.get.queryKey({ input: { id: lesson.id } }),
					api.core.lesson.list.queryKey(),
				]);
				toast.success({ title: "Lesson updated successfully" });
				setOpen(false);
			},
		}),
	);

	const form = useForm({
		defaultValues: {
			id: lesson.id,
			name: lesson.name,
			description: lesson.description ?? null,
			language: lesson.language,
			program: lesson.program,
			period: lesson.period
				? Math.round(getDurationFromInterval(lesson.period))
				: 60,
		} as LessonEditableData,
		validators: {
			onSubmit: lessonUpdateFormSchema as GetFormZod<
				typeof lessonUpdateFormSchema
			>,
		},
		onSubmit: async ({ value }) => {
			await mutateAsync({
				id: value.id,
				name: value.name.trim(),
				description: value.description?.trim() || null,
				language: value.language,
				program: value.program,
				period: value.period,
			});
		},
	});

	return (
		<Drawer open={open} onOpenChange={setOpen}>
			<DrawerTrigger asChild>{children}</DrawerTrigger>
			<DrawerContent>
				<DrawerHeader>
					<DrawerTitle>Edit Lesson</DrawerTitle>
					<DrawerDescription>
						Update curriculum details, language, and duration.
					</DrawerDescription>
				</DrawerHeader>

				<DrawerInner asChild>
					<form
						onSubmit={(e) => {
							e.preventDefault();
							e.stopPropagation();
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
											<FieldLabel htmlFor={field.name}>Lesson Name</FieldLabel>
											<Input
												id={field.name}
												name={field.name}
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
												aria-invalid={isInvalid}
												disabled={isPending}
											/>
											{isInvalid && (
												<FieldError errors={field.state.meta.errors} />
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
												value={field.state.value ?? ""}
												onBlur={field.handleBlur}
												onChange={(e) =>
													field.handleChange(e.target.value || null)
												}
												aria-invalid={isInvalid}
												disabled={isPending}
											/>
											{isInvalid && (
												<FieldError errors={field.state.meta.errors} />
											)}
										</Field>
									);
								}}
							/>

							<form.Field
								name="language"
								children={(field) => (
									<Field>
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
									</Field>
								)}
							/>

							<form.Field
								name="program"
								children={(field) => (
									<Field>
										<FieldLabel htmlFor={field.name}>Program</FieldLabel>
										<Select
											value={field.state.value}
											disabled={isPending}
											onValueChange={(val) => {
												if (val) field.handleChange(val);
											}}
										>
											<SelectTrigger id={field.name}>
												<SelectValue placeholder="Select program" />
											</SelectTrigger>
											<SelectContent>
												<SelectGroup>
													{programs.map((item) => (
														<SelectItem key={item.id} value={item.id}>
															{item.name}
														</SelectItem>
													))}
												</SelectGroup>
											</SelectContent>
										</Select>
									</Field>
								)}
							/>

							<form.Field
								name="period"
								children={(field) => (
									<Field>
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
									</Field>
								)}
							/>
						</FieldGroup>

						<form.Subscribe
							selector={(state) => [state.canSubmit, state.isDirty]}
							children={([canSubmit, isDirty]) => (
								<DrawerFooter>
									<Button
										type="submit"
										disabled={!isDirty || isPending || !canSubmit}
									>
										{isPending && <Spinner />}
										Save Changes
									</Button>
									<DrawerClose asChild>
										<Button variant="outline" type="button">
											Close
										</Button>
									</DrawerClose>
								</DrawerFooter>
							)}
						/>
					</form>
				</DrawerInner>
			</DrawerContent>
		</Drawer>
	);
}
