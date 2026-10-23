"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { type Schooling, schoolingZod } from "backend/config";
import { UpdateStudentSchema } from "backend/db";
import type React from "react";
import { useState } from "react";
import { sileo as toast } from "sileo";
import {
	Countries,
	type CountryCodes,
	Currencies,
	type CurrencyCodes,
	type LanguageCodes,
	Languages,
	resolveDefaultAmount,
} from "utils";
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
import { UserFormSelector } from "@/components/user-selector";
import { api, queryClient } from "@/hooks/api";
import { RoleRender } from "@/hooks/role";
import type { GetFormZod } from "@/lib/utils";
import { ProgramSelector } from "./selector";

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
		<Drawer
			open={open}
			onOpenChange={(next) => {
				setOpen(next);
				if (next) form.reset(student as StudentEditableData);
			}}
		>
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
									<ProgramSelector
										id={field.name}
										value={field.state.value}
										onValueChange={(val) =>
											field.handleChange(val || undefined)
										}
										onSelect={(program) => {
											const amount = resolveDefaultAmount(
												program.price,
												form.state.values.address?.country,
											);
											form.setFieldValue("amount", amount);
											form.setFieldValue("remaining", amount);
										}}
										disabled={isPending}
									/>
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

							<div className="grid grid-cols-2 gap-4">
								<form.Field
									name="age"
									children={(field) => (
										<Field>
											<FieldLabel htmlFor={field.name}>Age</FieldLabel>
											<Input
												id={field.name}
												name={field.name}
												type="number"
												value={field.state.value ?? ""}
												onBlur={field.handleBlur}
												onChange={(e) =>
													field.handleChange(
														e.target.value === ""
															? null
															: Number(e.target.value),
													)
												}
												disabled={isPending}
											/>
										</Field>
									)}
								/>

								<form.Field
									name="grade"
									children={(field) => (
										<Field>
											<FieldLabel htmlFor={field.name}>Grade</FieldLabel>
											<Input
												id={field.name}
												name={field.name}
												type="number"
												value={field.state.value ?? ""}
												onBlur={field.handleBlur}
												onChange={(e) =>
													field.handleChange(
														e.target.value === ""
															? null
															: Number(e.target.value),
													)
												}
												disabled={isPending}
											/>
										</Field>
									)}
								/>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<form.Field
									name="country"
									children={(field) => (
										<Field>
											<FieldLabel htmlFor={field.name}>Country</FieldLabel>
											<Select
												value={field.state.value ?? ""}
												onValueChange={(val) =>
													field.handleChange(val as CountryCodes)
												}
												disabled={isPending}
											>
												<SelectTrigger id={field.name}>
													<SelectValue placeholder="Select country" />
												</SelectTrigger>
												<SelectContent>
													<SelectGroup>
														{Object.entries(Countries).map(([code, name]) => (
															<SelectItem key={code} value={code}>
																{name}
															</SelectItem>
														))}
													</SelectGroup>
												</SelectContent>
											</Select>
										</Field>
									)}
								/>

								<form.Field
									name="currency"
									children={(field) => (
										<Field>
											<FieldLabel htmlFor={field.name}>Currency</FieldLabel>
											<Select
												value={field.state.value ?? ""}
												onValueChange={(val) =>
													field.handleChange(val as CurrencyCodes)
												}
												disabled={isPending}
											>
												<SelectTrigger id={field.name}>
													<SelectValue placeholder="Select currency" />
												</SelectTrigger>
												<SelectContent>
													<SelectGroup>
														{Object.entries(Currencies).map(([code, name]) => (
															<SelectItem key={code} value={code}>
																{code} · {name}
															</SelectItem>
														))}
													</SelectGroup>
												</SelectContent>
											</Select>
										</Field>
									)}
								/>
							</div>

							<form.Field
								name="mentorId"
								children={(field) => (
									<UserFormSelector
										id={field.name}
										label="Mentor"
										value={field.state.value}
										onValueChange={(val) =>
											field.handleChange(val ?? undefined)
										}
										api={api.core.teacher.list.queryOptions()}
										disabled={isPending}
									/>
								)}
							/>

							<RoleRender
								admin={undefined}
								enrollment_advisor={undefined}
								qa_auditor={undefined}
								scheduler={false}
								student={undefined}
								teacher={undefined}
								user={undefined}
							>
								<form.Field
									name="supervisorId"
									children={(field) => (
										<UserFormSelector
											id={field.name}
											label="Supervisor"
											value={field.state.value}
											onValueChange={(val) =>
												field.handleChange(val ?? undefined)
											}
											api={api.core.scheduler.list.queryOptions()}
											disabled={isPending}
										/>
									)}
								/>
							</RoleRender>

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
