"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
	type LanguageCodes,
	Languages,
	type Schooling,
	schoolingZod,
} from "backend/config";
import { UpdateStudentSchema } from "backend/db";
import type React from "react";
import { useState } from "react";
import { sileo as toast } from "sileo";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
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
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
	FieldLegend,
	FieldSet,
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
import { api, queryClient } from "@/hooks/api";
import type { GetFormZod } from "@/lib/utils";

const studentUpdateFormSchema = UpdateStudentSchema.required({
	id: true,
});

type StudentEditableData = z.infer<typeof studentUpdateFormSchema>;

export function EditStudentDrawer({
	student,
	children,
}: {
	student: NullifyOptional<StudentEditableData>;
	children: React.ReactElement;
}) {
	const [open, setOpen] = useState(false);
	const { data: programs = [] } = useQuery(
		api.core.program.list.queryOptions(),
	);

	const { mutateAsync, isPending } = useMutation(
		api.core.student.update.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries();
				toast.success({ title: "Student updated successfully" });
				setOpen(false);
			},
		}),
	);

	const form = useForm({
		defaultValues: student as StudentEditableData,
		validators: {
			onSubmit: studentUpdateFormSchema as GetFormZod<
				typeof studentUpdateFormSchema
			>,
		},
		onSubmit: async ({ value }) => {
			await mutateAsync(value);
		},
	});

	return (
		<Drawer open={open} onOpenChange={setOpen}>
			<DrawerTrigger asChild>{children}</DrawerTrigger>
			<DrawerContent>
				<DrawerHeader>
					<DrawerTitle>Edit Student</DrawerTitle>
					<DrawerDescription>
						Update student details, program, fees, and address.
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
								name="program"
								children={(field) => (
									<Field>
										<FieldLabel htmlFor={field.name}>Program</FieldLabel>
										<Select
											value={field.state.value ?? ""}
											onValueChange={(val) =>
												field.handleChange(val || undefined)
											}
											disabled={isPending}
										>
											<SelectTrigger id={field.name}>
												<SelectValue placeholder="Select program" />
											</SelectTrigger>
											<SelectContent>
												<SelectGroup>
													{programs.map((p) => (
														<SelectItem key={p.id} value={p.id}>
															{p.name}
														</SelectItem>
													))}
												</SelectGroup>
											</SelectContent>
										</Select>
									</Field>
								)}
							/>

							<form.Field
								name="schooling"
								children={(field) => (
									<Field>
										<FieldLabel htmlFor={field.name}>Schooling</FieldLabel>
										<Select
											value={field.state.value ?? ""}
											onValueChange={(val) =>
												field.handleChange((val as Schooling) || null)
											}
											disabled={isPending}
										>
											<SelectTrigger id={field.name}>
												<SelectValue placeholder="Select schooling" />
											</SelectTrigger>
											<SelectContent>
												<SelectGroup>
													{schoolingZod.options.map((school) => (
														<SelectItem key={school} value={school}>
															<span className="capitalize">{school}</span>
														</SelectItem>
													))}
												</SelectGroup>
											</SelectContent>
										</Select>
									</Field>
								)}
							/>

							<form.Field
								name="meetingLink"
								children={(field) => {
									const isInvalid =
										field.state.meta.isTouched && !field.state.meta.isValid;
									return (
										<Field data-invalid={isInvalid}>
											<FieldLabel htmlFor={field.name}>Meeting Link</FieldLabel>
											<Input
												id={field.name}
												name={field.name}
												value={field.state.value ?? ""}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
												placeholder="https://meet.google.com/..."
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
								name="mentorId"
								children={(field) => {
									const isInvalid =
										field.state.meta.isTouched && !field.state.meta.isValid;
									return (
										<Field data-invalid={isInvalid}>
											<FieldLabel htmlFor={field.name}>Mentor ID</FieldLabel>
											<Input
												id={field.name}
												name={field.name}
												value={field.state.value ?? ""}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
												placeholder="Teacher ID"
												disabled={isPending}
											/>
											{isInvalid && (
												<FieldError errors={field.state.meta.errors} />
											)}
										</Field>
									);
								}}
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
															id={`lang-${code}`}
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
														<FieldLabel htmlFor={`lang-${code}`}>
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
								name="paid"
								children={(field) => (
									<Field orientation="horizontal">
										<Checkbox
											id={field.name}
											checked={field.state.value}
											onCheckedChange={(checked) =>
												field.handleChange(Boolean(checked))
											}
											disabled={isPending}
										/>
										<FieldLabel htmlFor={field.name}>Fee Paid</FieldLabel>
									</Field>
								)}
							/>

							<div className="grid grid-cols-2 gap-4">
								<form.Field
									name="amount"
									children={(field) => {
										const isInvalid =
											field.state.meta.isTouched && !field.state.meta.isValid;
										return (
											<Field data-invalid={isInvalid}>
												<FieldLabel htmlFor={field.name}>
													Total Amount (₹)
												</FieldLabel>
												<Input
													id={field.name}
													name={field.name}
													type="number"
													value={field.state.value}
													onBlur={field.handleBlur}
													onChange={(e) =>
														field.handleChange(Number(e.target.value))
													}
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
									name="remaining"
									children={(field) => {
										const isInvalid =
											field.state.meta.isTouched && !field.state.meta.isValid;
										return (
											<Field data-invalid={isInvalid}>
												<FieldLabel htmlFor={field.name}>
													Remaining (₹)
												</FieldLabel>
												<Input
													id={field.name}
													name={field.name}
													type="number"
													value={field.state.value}
													onBlur={field.handleBlur}
													onChange={(e) =>
														field.handleChange(Number(e.target.value))
													}
													disabled={isPending}
												/>
												{isInvalid && (
													<FieldError errors={field.state.meta.errors} />
												)}
											</Field>
										);
									}}
								/>
							</div>

							<FieldSet>
								<FieldLegend>Address</FieldLegend>
								<FieldGroup>
									<form.Field
										name="address.line1"
										children={(field) => (
											<Field>
												<FieldLabel htmlFor={field.name}>
													Street Line 1
												</FieldLabel>
												<Input
													id={field.name}
													name={field.name}
													value={field.state.value ?? ""}
													onBlur={field.handleBlur}
													onChange={(e) => field.handleChange(e.target.value)}
													placeholder="123 Main St"
													disabled={isPending}
												/>
											</Field>
										)}
									/>
									<form.Field
										name="address.line2"
										children={(field) => (
											<Field>
												<FieldLabel htmlFor={field.name}>
													Street Line 2
												</FieldLabel>
												<Input
													id={field.name}
													name={field.name}
													value={field.state.value ?? ""}
													onBlur={field.handleBlur}
													onChange={(e) => field.handleChange(e.target.value)}
													placeholder="Apt, Suite, Bldg"
													disabled={isPending}
												/>
											</Field>
										)}
									/>
									<div className="grid grid-cols-2 gap-4">
										<form.Field
											name="address.city"
											children={(field) => (
												<Field>
													<FieldLabel htmlFor={field.name}>City</FieldLabel>
													<Input
														id={field.name}
														name={field.name}
														value={field.state.value ?? ""}
														onBlur={field.handleBlur}
														onChange={(e) => field.handleChange(e.target.value)}
														disabled={isPending}
													/>
												</Field>
											)}
										/>
										<form.Field
											name="address.state"
											children={(field) => (
												<Field>
													<FieldLabel htmlFor={field.name}>State</FieldLabel>
													<Input
														id={field.name}
														name={field.name}
														value={field.state.value ?? ""}
														onBlur={field.handleBlur}
														onChange={(e) => field.handleChange(e.target.value)}
														disabled={isPending}
													/>
												</Field>
											)}
										/>
									</div>
									<div className="grid grid-cols-2 gap-4">
										<form.Field
											name="address.postalCode"
											children={(field) => (
												<Field>
													<FieldLabel htmlFor={field.name}>
														Postal Code
													</FieldLabel>
													<Input
														id={field.name}
														name={field.name}
														value={field.state.value ?? ""}
														onBlur={field.handleBlur}
														onChange={(e) => field.handleChange(e.target.value)}
														disabled={isPending}
													/>
												</Field>
											)}
										/>
										<form.Field
											name="address.country"
											children={(field) => (
												<Field>
													<FieldLabel htmlFor={field.name}>Country</FieldLabel>
													<Input
														id={field.name}
														name={field.name}
														value={field.state.value ?? ""}
														onBlur={field.handleBlur}
														onChange={(e) => field.handleChange(e.target.value)}
														disabled={isPending}
													/>
												</Field>
											)}
										/>
									</div>
								</FieldGroup>
							</FieldSet>
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
								<DrawerClose asChild>
									<Button variant="outline" type="button">
										Close
									</Button>
								</DrawerClose>
							</DrawerFooter>
						)}
					/>
				</form>
			</DrawerContent>
		</Drawer>
	);
}
