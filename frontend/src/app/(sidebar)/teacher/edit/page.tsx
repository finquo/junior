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
import { orpc } from "@/lib/api";
import { experienceZod, LanguageCodeZod, Languages, type LanguageCodes } from "backend/config";


const teacherFormSchema = z.object({
	languages: z.array(LanguageCodeZod),
	experiences: z.array(experienceZod),
});

type TeacherFormValues = z.infer<typeof teacherFormSchema>;

interface ExperienceItemProps {
	index: number;
	// biome-ignore lint/suspicious/noExplicitAny: TanStack Form instance type
	form: any;
	isSaving: boolean;
	onRemove: () => void;
}

export function ExperienceItem({
	index,
	form,
	isSaving,
	onRemove,
}: ExperienceItemProps) {
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
						disabled={isSaving}
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
										disabled={isSaving}
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
										disabled={isSaving}
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
										disabled={isSaving}
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
									disabled={isSaving}
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
									disabled={isSaving}
								/>
							</Field>
						)}
					/>
				</FieldGroup>
			</CardContent>
		</Card>
	);
}

export default function TeacherProfilePage() {
	const { data: user } = useAuth();

	// Default data placeholder (will be replaced with an API call later)
	const defaultData: {
		languages?: LanguageCodes[];
		experiences?: TeacherFormValues["experiences"];
	} = {};

	const { mutate: updateTeacher, isPending: isSaving } = useMutation({
		mutationKey: ["teacher-update"],
		mutationFn: async (values: TeacherFormValues) => {
			return await orpc.teacher.update({
				languages: values.languages,
				experiences: values.experiences.map((exp) => ({
					...exp,
					description: exp.description?.trim() ? exp.description.trim() : undefined,
					endedAt: exp.endedAt?.trim() ? exp.endedAt.trim() : undefined,
				})),
			});
		},
		onSuccess: () => {
			toast.success({
				title: "Teacher profile updated successfully",
			});
		},
		onError: (error) => {
			toast.error({
				title: error.message || "Failed to update teacher profile",
			});
		},
	});

	const form = useForm({
		defaultValues: {
			languages: (defaultData.languages ?? []) as LanguageCodes[],
			experiences: (defaultData.experiences ?? []) as TeacherFormValues["experiences"],
		},
		validators: {
			onSubmit: teacherFormSchema,
			onChange: teacherFormSchema,
		},
		onSubmit: async ({ value }) => {
			updateTeacher(value);
		},
	});

	useEffect(() => {
		if (defaultData) {
			form.reset({
				languages: defaultData.languages ?? [],
				experiences: defaultData.experiences ?? [],
			});
		}
	}, [form]);

	return (
		<div className="flex flex-col flex-wrap gap-3 md:h-svh">
			<div>
				<EditProfile />
			</div>

			<div>
				<Card>
					<CardHeader>
						<CardTitle>Teacher Profile</CardTitle>
						<CardDescription>
							Update your teaching languages and professional experience.
						</CardDescription>
					</CardHeader>

					<form
						onSubmit={(e) => {
							e.preventDefault();
							e.stopPropagation();
							form.handleSubmit();
						}}
					>
						<CardContent>
							<FieldGroup>
								{/* Languages Field */}
								<form.Field
									name="languages"
									children={(field) => {
										const isInvalid =
											field.state.meta.isTouched && !field.state.meta.isValid;
										const selectedLanguages = field.state.value ?? [];

										const toggleLanguage = (code: string, checked: boolean) => {
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
													{Object.entries(Languages).map(([code, label]) => {
														const isChecked = selectedLanguages.includes(code);
														return (
															<Field key={code} orientation="horizontal">
																<Checkbox
																	id={`lang-${code}`}
																	checked={isChecked}
																	onCheckedChange={(checked) =>
																		toggleLanguage(code, !!checked)
																	}
																	disabled={isSaving}
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

								{/* Experiences Field wrapped in Card with CardAction */}
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
															disabled={isSaving}
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
																	isSaving={isSaving}
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
								<CardFooter>
									<Button
										type="button"
										variant="outline"
										onClick={() => form.reset()}
										disabled={!isDirty || isSaving}
									>
										Reset
									</Button>
									<Button
										type="submit"
										disabled={!isDirty || isSaving || !canSubmit}
									>
										{isSaving && <Spinner />}
										Save Teacher Profile
									</Button>
								</CardFooter>
							)}
						/>
					</form>
				</Card>
			</div>
		</div>
	);
}
