"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { useEffect } from "react";
import { sileo as toast } from "sileo";
import { z } from "zod";
import EditProfile from "@/app/(center)/user/edit/page";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "@/components/ui/empty";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
	FieldLegend,
	FieldSeparator,
	FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/auth";
import { experienceZod, LanguageCodeZod, Languages, LanguageCodeKey, type LanguageCodes } from "backend/config";
import { api } from "@/hooks/api";
import { getUserData } from "@/hooks/user";

const teacherFormSchema = z.object({
	languages: LanguageCodeZod.array(),
	experiences: experienceZod.array(),
});

type TeacherFormValues = z.infer<typeof teacherFormSchema>;

function ExperienceItem({
	index,
	form,
	isPending,
	onRemove,
}: {
	index: number;
	form: any;
	isPending: boolean;
	onRemove: () => void;
}) {
	return (
		<Card size="sm">
			<CardHeader>
				<CardTitle>Experience #{index + 1}</CardTitle>
				<CardAction>
					<Button
						type="button"
						variant="destructive"
						size="icon-xs"
						onClick={onRemove}
						disabled={isPending}
					>
						<Trash2Icon />
					</Button>
				</CardAction>
			</CardHeader>
			<CardContent>
				<FieldGroup>
					<form.Field
						name={`experiences[${index}].title`}
						children={(subField: any) => {
							const isInvalid =
								subField.state.meta.isTouched && !subField.state.meta.isValid;
							return (
								<Field data-invalid={isInvalid}>
									<FieldLabel htmlFor={subField.name}>Job Title / Role</FieldLabel>
									<Input
										id={subField.name}
										name={subField.name}
										placeholder="e.g. Senior Math Teacher"
										value={subField.state.value}
										onBlur={subField.handleBlur}
										onChange={(e) => subField.handleChange(e.target.value)}
										aria-invalid={isInvalid}
										disabled={isPending}
									/>
									{isInvalid && (
										<FieldError
											errors={subField.state.meta.errors.map((err: any) =>
												typeof err === "string" ? { message: err } : err,
											)}
										/>
									)}
								</Field>
							);
						}}
					/>

					<form.Field
						name={`experiences[${index}].organization`}
						children={(subField: any) => {
							const isInvalid =
								subField.state.meta.isTouched && !subField.state.meta.isValid;
							return (
								<Field data-invalid={isInvalid}>
									<FieldLabel htmlFor={subField.name}>
										Organization / School
									</FieldLabel>
									<Input
										id={subField.name}
										name={subField.name}
										placeholder="e.g. Greenwood High School"
										value={subField.state.value}
										onBlur={subField.handleBlur}
										onChange={(e) => subField.handleChange(e.target.value)}
										aria-invalid={isInvalid}
										disabled={isPending}
									/>
									{isInvalid && (
										<FieldError
											errors={subField.state.meta.errors.map((err: any) =>
												typeof err === "string" ? { message: err } : err,
											)}
										/>
									)}
								</Field>
							);
						}}
					/>

					<form.Field
						name={`experiences[${index}].startedAt`}
						children={(subField: any) => {
							const isInvalid =
								subField.state.meta.isTouched && !subField.state.meta.isValid;
							return (
								<Field data-invalid={isInvalid}>
									<FieldLabel htmlFor={subField.name}>Started At</FieldLabel>
									<Input
										id={subField.name}
										type="date"
										name={subField.name}
										value={subField.state.value}
										onBlur={subField.handleBlur}
										onChange={(e) => subField.handleChange(e.target.value)}
										aria-invalid={isInvalid}
										disabled={isPending}
									/>
									{isInvalid && (
										<FieldError
											errors={subField.state.meta.errors.map((err: any) =>
												typeof err === "string" ? { message: err } : err,
											)}
										/>
									)}
								</Field>
							);
						}}
					/>

					<form.Field
						name={`experiences[${index}].endedAt`}
						children={(subField: any) => (
							<Field>
								<FieldLabel htmlFor={subField.name}>
									Ended At (Leave blank if current)
								</FieldLabel>
								<Input
									id={subField.name}
									type="date"
									name={subField.name}
									value={subField.state.value ?? ""}
									onBlur={subField.handleBlur}
									onChange={(e) => subField.handleChange(e.target.value)}
									disabled={isPending}
								/>
							</Field>
						)}
					/>

					<form.Field
						name={`experiences[${index}].description`}
						children={(subField: any) => (
							<Field>
								<FieldLabel htmlFor={subField.name}>Description</FieldLabel>
								<Textarea
									id={subField.name}
									name={subField.name}
									placeholder="Brief summary of duties and achievements..."
									value={subField.state.value ?? ""}
									onBlur={subField.handleBlur}
									onChange={(e) => subField.handleChange(e.target.value)}
									disabled={isPending}
								/>
							</Field>
						)}
					/>
				</FieldGroup>
			</CardContent>
		</Card>
	);
}

export default function () {
	const { data: user } = useAuth();
	const { data } = getUserData()

	const { mutateAsync, isPending } = useMutation(api.teacher.update.mutationOptions());

	const form = useForm({
		defaultValues: {
			languages: (data?.teacherData?.languages ?? []),
			experiences: (data?.teacherData?.experiences ?? []),
		},
		validators: {
			onSubmit: teacherFormSchema,
			onChange: teacherFormSchema,
		},
		onSubmit: async ({ value }) => {
			mutateAsync(value);
		},
	});

	useEffect(() => {
		if (data?.teacherData) {
			form.reset({
				languages: data?.teacherData?.languages ?? [],
				experiences: data?.teacherData?.experiences ?? [],
			});
		}
	}, [form]);

	return (
		<div className="flex flex-col flex-wrap gap-3 md:h-svh">
			<div>
				<EditProfile />
			</div>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
			>
				<Card>
					<CardHeader>
						<CardTitle>Teacher Profile</CardTitle>
						<CardDescription>
							Update your teaching languages and professional experience.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<FieldGroup>
							<form.Field
								name="languages"
								children={(field) => {
									const isInvalid =
										field.state.meta.isTouched && !field.state.meta.isValid;
									const selectedLanguages = field.state.value ?? [];

									const toggleLanguage = (code: LanguageCodes, checked: boolean) => {
										if (checked) {
											if (!selectedLanguages.includes(code)) {
												field.handleChange([...selectedLanguages, code]);
											}
										} else {
											field.handleChange(
												selectedLanguages.filter((lang) => lang !== code),
											);
										}
									};

									return (
										<FieldSet data-invalid={isInvalid}>
											<FieldLegend>Languages Spoken</FieldLegend>
											<FieldDescription>
												Select the languages you are comfortable teaching in.
											</FieldDescription>

											<FieldGroup data-slot="checkbox-group">
												{(Object.entries(Languages) as [LanguageCodes, string][]).map(([code, label]) => {
													const isChecked = selectedLanguages.includes(code);
													return (
														<Field key={code} orientation="horizontal">
															<Checkbox
																id={`lang-${code}`}
																checked={isChecked}
																onCheckedChange={(checked) =>
																	toggleLanguage(code, !!checked)
																}
																disabled={isPending}
															/>
															<FieldLabel htmlFor={`lang-${code}`}>
																{label}
															</FieldLabel>
														</Field>
													);
												})}
											</FieldGroup>

											{isInvalid && (
												<FieldError
													errors={field.state.meta.errors.map((err) =>
														typeof err === "string" ? { message: err } : err,
													)}
												/>
											)}
										</FieldSet>
									);
								}}
							/>

							<FieldSeparator />

							<form.Field
								name="experiences"
								mode="array"
								children={(field: any) => {
									const experiences =
										(field.state.value ?? []) as TeacherFormValues["experiences"];

									const addExperience = () => {
										field.pushValue({
											title: "",
											organization: "",
											description: "",
											startedAt: "",
											endedAt: "",
											writtenBy: user?.name ?? "Teacher",
											createdAt: new Date().toISOString(),
										});
									};

									const removeExperience = (index: number) => {
										field.removeValue(index);
									};

									return (
										<Card size="sm">
											<CardHeader>
												<CardTitle>Professional Experiences</CardTitle>
												<CardDescription>
													List your teaching history and relevant work experience.
												</CardDescription>
												<CardAction>
													<Button
														type="button"
														variant="outline"
														size="sm"
														onClick={addExperience}
														disabled={isPending}
													>
														<PlusIcon />
														Add Experience
													</Button>
												</CardAction>
											</CardHeader>
											<CardContent>
												{experiences.length === 0 ? (
													<Empty>
														<EmptyHeader>
															<EmptyTitle>No experiences added</EmptyTitle>
															<EmptyDescription>
																Add your teaching history and relevant work experience.
															</EmptyDescription>
														</EmptyHeader>
													</Empty>
												) : (
													<FieldGroup>
														{experiences.map((_, index) => (
															<ExperienceItem
																key={index}
																index={index}
																form={form}
																isPending={isPending}
																onRemove={() => removeExperience(index)}
															/>
														))}
													</FieldGroup>
												)}
											</CardContent>
										</Card>
									);
								}}
							/>
						</FieldGroup>
					</CardContent>

					<form.Subscribe
						selector={(state) => [state.canSubmit, state.isDirty]}
						children={([canSubmit, isDirty]) => (
							<CardFooter className="justify-end">
								<Button
									type="button"
									variant="outline"
									onClick={() => form.reset()}
									disabled={!isDirty || isPending}
								>
									Reset
								</Button>
								<Button
									type="submit"
									disabled={!isDirty || isPending || !canSubmit}
								>
									{isPending && <Spinner />}
									Save Teacher Profile
								</Button>
							</CardFooter>
						)}
					/>
				</Card>
			</form>
		</div>
	);
}
