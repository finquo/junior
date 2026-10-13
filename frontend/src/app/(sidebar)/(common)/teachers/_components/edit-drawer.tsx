"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import {
	type Experience,
	type LanguageCodes,
	Languages,
	UpdateTeacherSchema,
} from "backend/config";
import { PenIcon, PlusIcon, Trash2Icon } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { sileo as toast } from "sileo";
import type z from "zod";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "@/components/ui/drawer";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "@/components/ui/empty";
import {
	Field,
	FieldGroup,
	FieldLabel,
	FieldLegend,
	FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { UserFormSelector } from "@/components/user-selector";
import { api, queryClient } from "@/hooks/api";
import type { GetFormZod } from "@/lib/utils";

const teacherUpdateFormSchema = UpdateTeacherSchema.required({
	id: true,
});

type TeacherEditableData = z.infer<typeof teacherUpdateFormSchema>;

function ExperienceFormItem({
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
						children={(subField: any) => (
							<Field>
								<FieldLabel htmlFor={subField.name}>Title</FieldLabel>
								<Input
									id={subField.name}
									value={subField.state.value}
									onBlur={subField.handleBlur}
									onChange={(e) => subField.handleChange(e.target.value)}
									placeholder="e.g. Senior Math Teacher"
									disabled={isPending}
								/>
							</Field>
						)}
					/>
					<form.Field
						name={`experiences[${index}].organization`}
						children={(subField: any) => (
							<Field>
								<FieldLabel htmlFor={subField.name}>Organization</FieldLabel>
								<Input
									id={subField.name}
									value={subField.state.value}
									onBlur={subField.handleBlur}
									onChange={(e) => subField.handleChange(e.target.value)}
									placeholder="e.g. Greenwood High"
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
								<Input
									id={subField.name}
									value={subField.state.value ?? ""}
									onBlur={subField.handleBlur}
									onChange={(e) => subField.handleChange(e.target.value)}
									disabled={isPending}
								/>
							</Field>
						)}
					/>
					<div className="grid grid-cols-2 gap-4">
						<form.Field
							name={`experiences[${index}].startedAt`}
							children={(subField: any) => (
								<Field>
									<FieldLabel htmlFor={subField.name}>Start Date</FieldLabel>
									<Input
										id={subField.name}
										type="date"
										value={
											subField.state.value
												? String(subField.state.value).split("T")[0]
												: ""
										}
										onBlur={subField.handleBlur}
										onChange={(e) => subField.handleChange(e.target.value)}
										disabled={isPending}
									/>
								</Field>
							)}
						/>
						<form.Field
							name={`experiences[${index}].endedAt`}
							children={(subField: any) => (
								<Field>
									<FieldLabel htmlFor={subField.name}>End Date</FieldLabel>
									<Input
										id={subField.name}
										type="date"
										value={
											subField.state.value
												? String(subField.state.value).split("T")[0]
												: ""
										}
										onBlur={subField.handleBlur}
										onChange={(e) =>
											subField.handleChange(e.target.value || undefined)
										}
										disabled={isPending}
									/>
								</Field>
							)}
						/>
					</div>
				</FieldGroup>
			</CardContent>
		</Card>
	);
}

export function EditTeacherDrawer({
	teacher,
	children,
}: {
	teacher: NullifyOptional<TeacherEditableData>;
	children: React.ReactElement;
}) {
	const [open, setOpen] = useState(false);

	const { mutateAsync, isPending } = useMutation(
		api.core.teacher.update.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries();
				toast.success({ title: "Teacher updated successfully" });
				setOpen(false);
			},
		}),
	);

	const form = useForm({
		defaultValues: teacher as TeacherEditableData,
		validators: {
			onSubmit: teacherUpdateFormSchema as GetFormZod<
				typeof teacherUpdateFormSchema
			>,
		},
		onSubmit: async ({ value }) => {
			await mutateAsync(value);
		},
	});

	useEffect(() => {
		if (teacher) {
			form.reset({
				id: teacher.id,
				supervisorId: (teacher.supervisorId ?? undefined) as string | undefined,
				languages: (teacher.languages ?? []) as LanguageCodes[],
				experiences: (teacher.experiences ?? []) as Experience[],
			});
		}
	}, [teacher, form]);

	return (
		<Drawer open={open} onOpenChange={setOpen}>
			<DrawerTrigger render={children} />
			<DrawerContent>
				<DrawerHeader>
					<DrawerTitle>Edit Teacher</DrawerTitle>
					<DrawerDescription>
						Update supervisor, languages, and experience history.
					</DrawerDescription>
				</DrawerHeader>

				<form
					className="flex flex-1 flex-col overflow-hidden"
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						form.handleSubmit();
					}}
				>
					<div className="flex-1 space-y-4 overflow-y-auto p-4">
						<FieldGroup>
							<form.Field
								name="supervisorId"
								children={(field) => (
									<UserFormSelector
										id={field.name}
										label="Supervisor"
										value={field.state.value}
										onValueChange={(val) =>
											field.handleChange(val || undefined)
										}
										api={api.core.scheduler.list.queryOptions()}
										disabled={isPending}
									/>
								)}
							/>

							<FieldSet>
								<FieldLegend>Languages</FieldLegend>
								<FieldGroup data-slot="checkbox-group">
									{Object.entries(Languages).map(([code, label]) => (
										<form.Field
											key={code}
											name="languages"
											children={(field) => {
												const checked = (field.state.value ?? []).includes(
													code as LanguageCodes,
												);
												return (
													<Field orientation="horizontal">
														<Checkbox
															id={`teacher-lang-${code}`}
															checked={checked}
															onCheckedChange={(isChecked) => {
																const current = field.state.value ?? [];
																if (isChecked) {
																	field.handleChange([
																		...current,
																		code as LanguageCodes,
																	]);
																} else {
																	field.handleChange(
																		current.filter((c) => c !== code),
																	);
																}
															}}
															disabled={isPending}
														/>
														<FieldLabel htmlFor={`teacher-lang-${code}`}>
															{label}
														</FieldLabel>
													</Field>
												);
											}}
										/>
									))}
								</FieldGroup>
							</FieldSet>

							<form.Field
								name="experiences"
								mode="array"
								children={(field) => {
									const items = field.state.value ?? [];
									return (
										<Card size="sm">
											<CardHeader>
												<CardTitle>Experiences</CardTitle>
												<CardDescription>
													Manage past teaching experiences.
												</CardDescription>
												<CardAction>
													<Button
														type="button"
														variant="outline"
														size="sm"
														onClick={() =>
															field.pushValue({
																title: "",
																organization: "",
																description: "",
																startedAt: new Date().toISOString(),
																endedAt: undefined,
																createdAt: new Date().toISOString(),
															})
														}
														disabled={isPending}
													>
														<PlusIcon />
														Add Experience
													</Button>
												</CardAction>
											</CardHeader>
											<CardContent>
												{items.length === 0 ? (
													<Empty>
														<EmptyHeader>
															<EmptyTitle>No experiences added</EmptyTitle>
															<EmptyDescription>
																Click "Add Experience" to add work history.
															</EmptyDescription>
														</EmptyHeader>
													</Empty>
												) : (
													<FieldGroup>
														{items.map((_, index) => (
															<ExperienceFormItem
																key={index}
																index={index}
																form={form}
																isPending={isPending}
																onRemove={() => field.removeValue(index)}
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
					</div>

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
								<DrawerClose
									nativeButton={false}
									render={<Button variant="outline" type="button" />}
								>
									Close
								</DrawerClose>
							</DrawerFooter>
						)}
					/>
				</form>
			</DrawerContent>
		</Drawer>
	);
}
