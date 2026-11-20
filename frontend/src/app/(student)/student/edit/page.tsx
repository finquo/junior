"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
	type Address,
	addressZod,
	type Schooling,
	schoolingZod,
} from "backend/config";
import { SelectStudentSchema } from "backend/db";
import { useState } from "react";
import { sileo as toast } from "sileo";
import { Countries, type CountryCodes, PhoneNumberZod } from "utils";
import type { z } from "zod";
import Loader from "@/components/loader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Field,
	FieldDescription,
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
import { api, refetchAPIs } from "@/hooks/api";
import { useAuth } from "@/hooks/auth";
import type { API_Returns } from "@/lib/api";
import type { GetFormZod } from "@/lib/utils";
import { snakeToTitleCase } from "@/lib/utils";

type StudentData = NonNullable<API_Returns["student"]["get"]>[number];

const studentEditSchema = SelectStudentSchema.pick({
	age: true,
	grade: true,
	schooling: true,
	country: true,
}).extend({
	phoneNumber: PhoneNumberZod.optional(),
	// Addresses are optional: all fields blank means no address (saved as null).
	address: addressZod.partial(),
	currentAddress: addressZod.partial(),
});

type StudentEditValues = z.infer<typeof studentEditSchema>;
type AddressFormValues = StudentEditValues["address"];

function toAddressValues(
	address: Address | null | undefined,
): AddressFormValues {
	return {
		line1: address?.line1,
		line2: address?.line2,
		city: address?.city,
		state: address?.state,
		postalCode: address?.postalCode,
		country: address?.country,
	};
}

function toFormValues(
	student: StudentData,
	phoneNumber: string | null | undefined,
): StudentEditValues {
	return {
		phoneNumber: phoneNumber ?? undefined,
		age: student.age ?? null,
		grade: student.grade ?? null,
		schooling: student.schooling ?? null,
		country: student.country ?? null,
		address: toAddressValues(student.address),
		currentAddress: toAddressValues(student.currentAddress),
	};
}

// `undefined` means the address is partly filled, so the user must finish it.
const toServerAddress = (
	address: AddressFormValues | undefined,
): Address | null | undefined => {
	const values = Object.values(address ?? {});
	if (values.every((value) => !value?.trim())) return null;

	const { line1, line2, city, state, postalCode, country } = address ?? {};
	if (!line1 || !city || !state || !postalCode || !country) return undefined;

	return {
		line1,
		line2: line2?.trim() || undefined,
		city,
		state,
		postalCode,
		country,
	};
};

const fieldErrors = (field: {
	state: { meta: { isTouched: boolean; isValid: boolean; errors: unknown[] } };
}) => {
	const { isTouched, isValid, errors } = field.state.meta;
	if (!(isTouched && !isValid)) return [];
	return errors
		.map((err) =>
			typeof err === "string" ? { message: err } : (err as { message?: string }),
		)
		.filter((err) => err?.message);
};

const schoolingOptions = schoolingZod.options.map((school) => ({
	value: school,
	label: snakeToTitleCase(school) ?? school,
}));

const countryOptions = Object.entries(Countries).map(([code, name]) => ({
	value: code,
	label: name,
}));

function StudentEditForm({ student }: { student: StudentData }) {
	const { mutateAsync, isPending } = useMutation(
		api.student.update.mutationOptions({
			onSuccess: () => {
				refetchAPIs([
					api.student.get.queryKey(),
					api.core.self.student.queryKey(),
				]);
				toast.success({ title: "Profile updated successfully" });
			},
			onError: (error) => {
				toast.error({
					title: error.message || "Failed to update profile",
				});
			},
		}),
	);

	const { data: user, refetch: refetchUser } = useAuth<true>();

	const { mutateAsync: updatePhoneNumber } = useMutation(
		api.common.updatePhoneNumber.mutationOptions(),
	);

	const [sameAsPermanent, setSameAsPermanent] = useState(true);

	const form = useForm({
		defaultValues: toFormValues(student, user.phoneNumber),
		validators: {
			onSubmit: studentEditSchema as GetFormZod<typeof studentEditSchema>,
		},
		onSubmit: async ({ value }) => {
			const address = toServerAddress(value.address);
			const currentAddress = toServerAddress(
				sameAsPermanent ? value.address : value.currentAddress,
			);

			if (address === undefined || currentAddress === undefined) {
				toast.error({
					title: "Complete the address or clear all of its fields",
				});
				return;
			}

			if (value.phoneNumber !== (user.phoneNumber ?? undefined)) {
				await updatePhoneNumber({ phoneNumber: value.phoneNumber ?? null });
				refetchUser();
			}

			await mutateAsync({
				age: value.age,
				grade: value.grade,
				schooling: value.schooling,
				country: value.country,
				address,
				currentAddress,
			});
		},
	});

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				e.stopPropagation();
				form.handleSubmit();
			}}
		>
			<div className="grid gap-6 md:grid-cols-2">
				<FieldGroup className="gap-4">
					<form.Field
						name="phoneNumber"
						children={(field) => {
							const isInvalid =
								field.state.meta.isTouched && !field.state.meta.isValid;
							return (
								<Field data-invalid={isInvalid}>
									<FieldLabel htmlFor={field.name}>Phone Number</FieldLabel>
									<Input
										id={field.name}
										name={field.name}
										type="tel"
										placeholder="+919876543210"
										value={field.state.value ?? ""}
										onBlur={field.handleBlur}
										onChange={(e) =>
											field.handleChange(e.target.value || undefined)
										}
										aria-invalid={isInvalid}
										disabled={isPending}
									/>
									<FieldDescription>
										International format, e.g. +919876543210.
									</FieldDescription>
									{isInvalid ? <FieldError errors={fieldErrors(field)} /> : null}
								</Field>
							);
						}}
					/>

					<div className="grid grid-cols-2 gap-4">
						<form.Field
							name="age"
							children={(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>Age</FieldLabel>
										<Input
											id={field.name}
											name={field.name}
											type="number"
											value={field.state.value ?? ""}
											onBlur={field.handleBlur}
											onChange={(e) =>
												field.handleChange(
													e.target.value === "" ? null : Number(e.target.value),
												)
											}
											aria-invalid={isInvalid}
											disabled={isPending}
										/>
										<FieldDescription>Your current age</FieldDescription>
										{isInvalid ? (
											<FieldError errors={fieldErrors(field)} />
										) : null}
									</Field>
								);
							}}
						/>

						<form.Field
							name="grade"
							children={(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>Grade</FieldLabel>
										<Input
											id={field.name}
											name={field.name}
											type="number"
											value={field.state.value ?? ""}
											onBlur={field.handleBlur}
											onChange={(e) =>
												field.handleChange(
													e.target.value === "" ? null : Number(e.target.value),
												)
											}
											aria-invalid={isInvalid}
											disabled={isPending}
										/>
										<FieldDescription>
											The grade you are studying in
										</FieldDescription>
										{isInvalid ? (
											<FieldError errors={fieldErrors(field)} />
										) : null}
									</Field>
								);
							}}
						/>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<form.Field
							name="schooling"
							children={(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>Schooling</FieldLabel>
										<Select
											value={field.state.value ?? ""}
											disabled={isPending}
											onValueChange={(val) =>
												field.handleChange((val as Schooling) || null)
											}
										>
											<SelectTrigger id={field.name} className="w-full">
												<SelectValue placeholder="Select schooling" />
											</SelectTrigger>
											<SelectContent>
												<SelectGroup>
													{schoolingOptions.map((option) => (
														<SelectItem key={option.value} value={option.value}>
															{option.label}
														</SelectItem>
													))}
												</SelectGroup>
											</SelectContent>
										</Select>
										<FieldDescription>Your school board</FieldDescription>
										{isInvalid ? (
											<FieldError errors={fieldErrors(field)} />
										) : null}
									</Field>
								);
							}}
						/>

						<form.Field
							name="country"
							children={(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>Country</FieldLabel>
										<Select
											value={field.state.value ?? ""}
											disabled={isPending}
											onValueChange={(val) =>
												field.handleChange((val as CountryCodes) || null)
											}
										>
											<SelectTrigger id={field.name} className="w-full">
												<SelectValue placeholder="Select country" />
											</SelectTrigger>
											<SelectContent>
												<SelectGroup>
													{countryOptions.map((option) => (
														<SelectItem key={option.value} value={option.value}>
															{option.label}
														</SelectItem>
													))}
												</SelectGroup>
											</SelectContent>
										</Select>
										<FieldDescription>Where you live</FieldDescription>
										{isInvalid ? (
											<FieldError errors={fieldErrors(field)} />
										) : null}
									</Field>
								);
							}}
						/>
					</div>
				</FieldGroup>

				<div className="flex flex-col gap-6">
					<FieldSet>
						<FieldLegend>Address</FieldLegend>
						<FieldDescription>
							Where the institute can reach your family
						</FieldDescription>

						<FieldGroup className="gap-4">
							<form.Field
								name="address.line1"
								children={(field) => {
									const isInvalid =
										field.state.meta.isTouched && !field.state.meta.isValid;
									return (
										<Field data-invalid={isInvalid}>
											<FieldLabel htmlFor={field.name}>Street Line 1</FieldLabel>
											<Input
												id={field.name}
												name={field.name}
												placeholder="123 Main St"
												value={field.state.value ?? ""}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
												aria-invalid={isInvalid}
												disabled={isPending}
											/>
											{isInvalid ? (
												<FieldError errors={fieldErrors(field)} />
											) : null}
										</Field>
									);
								}}
							/>

							<form.Field
								name="address.line2"
								children={(field) => (
									<Field>
										<FieldLabel htmlFor={field.name}>
											Street Line 2 (optional)
										</FieldLabel>
										<Input
											id={field.name}
											name={field.name}
											placeholder="Apt, Suite, Bldg"
											value={field.state.value ?? ""}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
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
											<FieldLabel htmlFor={field.name}>Postal Code</FieldLabel>
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

					<FieldSet>
						<FieldLegend>Current Address</FieldLegend>
						<FieldDescription>Where you are staying right now</FieldDescription>

						<Field orientation="horizontal">
							<Checkbox
								id="sameAsPermanent"
								checked={sameAsPermanent}
								onCheckedChange={(checked) => {
									const isSame = checked === true;
									setSameAsPermanent(isSame);
									if (isSame) {
										form.setFieldValue(
											"currentAddress",
											form.getFieldValue("address"),
										);
									}
								}}
								disabled={isPending}
							/>
							<FieldLabel htmlFor="sameAsPermanent">
								Same as permanent address
							</FieldLabel>
						</Field>

						{!sameAsPermanent ? (
							<FieldGroup className="gap-4">
								<form.Field
									name="currentAddress.line1"
									children={(field) => (
										<Field>
											<FieldLabel htmlFor={field.name}>Street Line 1</FieldLabel>
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
									name="currentAddress.line2"
									children={(field) => (
										<Field>
											<FieldLabel htmlFor={field.name}>
												Street Line 2 (optional)
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
								<div className="grid grid-cols-2 gap-4">
									<form.Field
										name="currentAddress.city"
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
										name="currentAddress.state"
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
										name="currentAddress.postalCode"
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
										name="currentAddress.country"
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
						) : null}
					</FieldSet>
				</div>
			</div>

			<form.Subscribe
				selector={(state) => [state.canSubmit, state.isDirty]}
				children={([canSubmit, isDirty]) => (
					<CardFooter className="justify-end">
						<Button
							type="button"
							variant="secondary"
							onClick={() =>
								form.reset(toFormValues(student, user.phoneNumber))
							}
							disabled={!isDirty || isPending}
						>
							Reset
						</Button>
						<Button
							type="submit"
							disabled={!isDirty || isPending || !canSubmit}
						>
							{isPending ? <Spinner /> : null}
							Save
						</Button>
					</CardFooter>
				)}
			/>
		</form>
	);
}

export default function Page() {
	const {
		data: student,
		isPending,
		isError,
	} = useQuery(api.student.get.queryOptions());

	const record = Array.isArray(student) ? student[0] : student;

	if (isPending) return <Loader />;

	if (isError || !record) {
		return (
			<Alert variant="destructive">
				<AlertTitle>Profile Unavailable</AlertTitle>
				<AlertDescription>
					Your student record could not be loaded.
				</AlertDescription>
			</Alert>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Edit Profile</CardTitle>
				<CardDescription>
					Update your student details and address
				</CardDescription>
			</CardHeader>
			<CardContent>
				<StudentEditForm student={record} />
			</CardContent>
		</Card>
	);
}
