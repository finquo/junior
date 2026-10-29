"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { UpdateStudentSchema } from "backend/db";
import type React from "react";
import { useState } from "react";
import { sileo as toast } from "sileo";
import { Currencies, getCurrencySymbol } from "utils";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
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
import { api, refetchAPIs } from "@/hooks/api";
import type { GetFormZod } from "@/lib/utils";
import { ProgramSelector } from "../../../_components/selector";

const feesFormSchema = UpdateStudentSchema.pick({
	id: true,
	program: true,
	currency: true,
	amount: true,
	remaining: true,
}).required({
	id: true,
	currency: true,
	amount: true,
	remaining: true,
});

type FeesFormValues = z.infer<typeof feesFormSchema>;

export function PaymentsDrawer({
	student,
	children,
}: {
	student: FeesFormValues & { paid: boolean };
	children: React.ReactElement;
}) {
	const [open, setOpen] = useState(false);

	const { mutateAsync, isPending } = useMutation(
		api.core.student.update.mutationOptions({
			onSuccess: () => {
				refetchAPIs([
					api.core.student.get.queryKey({ input: { id: student.id } }),
					api.core.payment.list.queryKey({ input: {} }),
				]);
				toast.success({ title: "Student fees updated" });
				setOpen(false);
			},
			onError: (error) => {
				toast.error({
					title: error.message || "Failed to update student fees",
				});
			},
		}),
	);

	const form = useForm({
		defaultValues: {
			id: student.id,
			program: student.program,
			currency: student.currency,
			amount: student.amount,
			remaining: student.remaining,
		} as FeesFormValues,
		validators: {
			onSubmit: feesFormSchema as GetFormZod<typeof feesFormSchema>,
		},
		onSubmit: async ({ value }) => {
			await mutateAsync({
				...value,
				paid: value.remaining <= 0,
			});
		},
	});

	return (
		<Drawer
			open={open}
			onOpenChange={(next) => {
				setOpen(next);
				if (next) {
					form.reset({
						id: student.id,
						program: student.program,
						currency: student.currency,
						amount: student.amount,
						remaining: student.remaining,
					});
				}
			}}
		>
			<DrawerTrigger asChild>{children}</DrawerTrigger>
			<DrawerContent>
				<DrawerHeader>
					<DrawerTitle>Student Fees</DrawerTitle>
					<DrawerDescription>
						Manage the program, currency, and cost of the student's fees.
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
										disabled={isPending}
									/>
								)}
							/>

							<form.Field
								name="currency"
								children={(field) => (
									<Field>
										<FieldLabel htmlFor={field.name}>Currency</FieldLabel>
										<Select
											items={Currencies}
											value={field.state.value}
											onValueChange={(val) =>
												field.handleChange(val as FeesFormValues["currency"])
											}
											disabled={isPending}
										>
											<SelectTrigger
												id={field.name}
												className="w-full min-w-[200px]"
											>
												<SelectValue placeholder="Select currency" />
											</SelectTrigger>
											<SelectContent>
												<SelectGroup>
													{Object.entries(Currencies).map(([code, name]) => (
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

							<div className="grid grid-cols-2 gap-4">
								<form.Field
									name="amount"
									children={(field) => {
										const isInvalid =
											field.state.meta.isTouched && !field.state.meta.isValid;
										return (
											<Field data-invalid={isInvalid}>
												<FieldLabel htmlFor={field.name}>
													Cost (
													{getCurrencySymbol(
														form.state.values.currency ?? "INR",
													)}
													)
												</FieldLabel>
												<Input
													id={field.name}
													name={field.name}
													type="number"
													value={field.state.value}
													onBlur={field.handleBlur}
													onChange={(e) =>
														field.handleChange(
															e.target.value === ""
																? 0
																: Number(e.target.value),
														)
													}
													aria-invalid={isInvalid}
													disabled={isPending}
												/>
												<FieldDescription>
													Total program cost owed by the student
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
									name="remaining"
									children={(field) => {
										const isInvalid =
											field.state.meta.isTouched && !field.state.meta.isValid;
										return (
											<Field data-invalid={isInvalid}>
												<FieldLabel htmlFor={field.name}>
													Remaining (
													{getCurrencySymbol(
														form.state.values.currency ?? "INR",
													)}
													)
												</FieldLabel>
												<Input
													id={field.name}
													name={field.name}
													type="number"
													value={field.state.value}
													onBlur={field.handleBlur}
													onChange={(e) =>
														field.handleChange(
															e.target.value === ""
																? 0
																: Number(e.target.value),
														)
													}
													aria-invalid={isInvalid}
													disabled={isPending}
												/>
												<FieldDescription>
													Amount still left to pay; recorded payments use this
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
							</div>
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
