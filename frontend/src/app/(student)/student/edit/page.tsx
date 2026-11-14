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
import { Alert } from "@/components/arc/alert/alert";
import { Button as ArcButton } from "@/components/arc/button/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/arc/card/card";
import { Checkbox } from "@/components/arc/checkbox/checkbox";
import { Input } from "@/components/arc/input/input";
import { Select } from "@/components/arc/select/select";
import Loader from "@/components/loader";
import { FieldDescription, FieldLegend, FieldSet } from "@/components/ui/field";
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

const errorMessage = (field: {
	state: { meta: { isTouched: boolean; isValid: boolean; errors: unknown[] } };
}) => {
	const { isTouched, isValid, errors } = field.state.meta;
	if (!(isTouched && !isValid)) return undefined;
	return errors
		.map((err) =>
			typeof err === "string" ? err : (err as { message?: string })?.message,
		)
		.filter(Boolean)
		.join(", ");
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
				<div className="flex flex-col gap-4">
					<form.Field
						name="phoneNumber"
						children={(field) => (
							<Input
								id={field.name}
								name={field.name}
								label="Phone Number"
								description="International format, e.g. +919876543210."
								type="tel"
								placeholder="+919876543210"
								value={field.state.value ?? ""}
								onBlur={field.handleBlur}
								onChange={(e) =>
									field.handleChange(e.target.value || undefined)
								}
								disabled={isPending}
							/>
						)}
					/>

					<div className="grid grid-cols-2 gap-4">
						<form.Field
							name="age"
							children={(field) => (
								<Input
									id={field.name}
									name={field.name}
									label="Age"
									description="Your current age"
									type="number"
									value={field.state.value ?? ""}
									onBlur={field.handleBlur}
									onChange={(e) =>
										field.handleChange(
											e.target.value === "" ? null : Number(e.target.value),
										)
									}
									disabled={isPending}
								/>
							)}
						/>

						<form.Field
							name="grade"
							children={(field) => (
								<Input
									id={field.name}
									name={field.name}
									label="Grade"
									description="The grade you are studying in"
									type="number"
									value={field.state.value ?? ""}
									onBlur={field.handleBlur}
									onChange={(e) =>
										field.handleChange(
											e.target.value === "" ? null : Number(e.target.value),
										)
									}
									disabled={isPending}
								/>
							)}
						/>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<form.Field
							name="schooling"
							children={(field) => (
								<Select
									id={field.name}
									label="Schooling"
									description="Your school board"
									placeholder="Select schooling"
									options={schoolingOptions}
									value={field.state.value ?? ""}
									onValueChange={(val) =>
										field.handleChange((val as Schooling) || null)
									}
									disabled={isPending}
								/>
							)}
						/>

						<form.Field
							name="country"
							children={(field) => (
								<Select
									id={field.name}
									label="Country"
									description="Where you live"
									placeholder="Select country"
									options={countryOptions}
									value={field.state.value ?? ""}
									onValueChange={(val) =>
										field.handleChange((val as CountryCodes) || null)
									}
									disabled={isPending}
								/>
							)}
						/>
					</div>
				</div>

				<div className="flex flex-col gap-6">
					<FieldSet>
						<FieldLegend>Address</FieldLegend>
						<FieldDescription>
							Where the institute can reach your family
						</FieldDescription>

						<div className="flex flex-col gap-4">
							<form.Field
								name="address.line1"
								children={(field) => (
									<Input
										id={field.name}
										name={field.name}
										label="Street Line 1"
										placeholder="123 Main St"
										value={field.state.value ?? ""}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										error={errorMessage(field)}
										disabled={isPending}
									/>
								)}
							/>

							<form.Field
								name="address.line2"
								children={(field) => (
									<Input
										id={field.name}
										name={field.name}
										label="Street Line 2 (optional)"
										placeholder="Apt, Suite, Bldg"
										value={field.state.value ?? ""}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										disabled={isPending}
									/>
								)}
							/>

							<div className="grid grid-cols-2 gap-4">
								<form.Field
									name="address.city"
									children={(field) => (
										<Input
											id={field.name}
											name={field.name}
											label="City"
											value={field.state.value ?? ""}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											disabled={isPending}
										/>
									)}
								/>

								<form.Field
									name="address.state"
									children={(field) => (
										<Input
											id={field.name}
											name={field.name}
											label="State"
											value={field.state.value ?? ""}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											disabled={isPending}
										/>
									)}
								/>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<form.Field
									name="address.postalCode"
									children={(field) => (
										<Input
											id={field.name}
											name={field.name}
											label="Postal Code"
											value={field.state.value ?? ""}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											disabled={isPending}
										/>
									)}
								/>

								<form.Field
									name="address.country"
									children={(field) => (
										<Input
											id={field.name}
											name={field.name}
											label="Country"
											value={field.state.value ?? ""}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											disabled={isPending}
										/>
									)}
								/>
							</div>
						</div>
					</FieldSet>

					<FieldSet>
						<FieldLegend>Current Address</FieldLegend>
						<FieldDescription>Where you are staying right now</FieldDescription>

						<Checkbox
							id="sameAsPermanent"
							label="Same as permanent address"
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

						{!sameAsPermanent && (
							<div className="flex flex-col gap-4">
								<form.Field
									name="currentAddress.line1"
									children={(field) => (
										<Input
											id={field.name}
											name={field.name}
											label="Street Line 1"
											value={field.state.value ?? ""}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											disabled={isPending}
										/>
									)}
								/>
								<form.Field
									name="currentAddress.line2"
									children={(field) => (
										<Input
											id={field.name}
											name={field.name}
											label="Street Line 2 (optional)"
											value={field.state.value ?? ""}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											disabled={isPending}
										/>
									)}
								/>
								<div className="grid grid-cols-2 gap-4">
									<form.Field
										name="currentAddress.city"
										children={(field) => (
											<Input
												id={field.name}
												name={field.name}
												label="City"
												value={field.state.value ?? ""}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
												disabled={isPending}
											/>
										)}
									/>
									<form.Field
										name="currentAddress.state"
										children={(field) => (
											<Input
												id={field.name}
												name={field.name}
												label="State"
												value={field.state.value ?? ""}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
												disabled={isPending}
											/>
										)}
									/>
								</div>
								<div className="grid grid-cols-2 gap-4">
									<form.Field
										name="currentAddress.postalCode"
										children={(field) => (
											<Input
												id={field.name}
												name={field.name}
												label="Postal Code"
												value={field.state.value ?? ""}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
												disabled={isPending}
											/>
										)}
									/>
									<form.Field
										name="currentAddress.country"
										children={(field) => (
											<Input
												id={field.name}
												name={field.name}
												label="Country"
												value={field.state.value ?? ""}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
												disabled={isPending}
											/>
										)}
									/>
								</div>
							</div>
						)}
					</FieldSet>
				</div>
			</div>

			<form.Subscribe
				selector={(state) => [state.canSubmit, state.isDirty]}
				children={([canSubmit, isDirty]) => (
					<CardFooter style={{ justifyContent: "flex-end" }}>
						<ArcButton
							type="button"
							variant="secondary"
							onClick={() =>
								form.reset(toFormValues(student, user.phoneNumber))
							}
							disabled={!isDirty || isPending}
						>
							Reset
						</ArcButton>
						<ArcButton
							type="submit"
							loading={isPending}
							disabled={!isDirty || isPending || !canSubmit}
						>
							Save
						</ArcButton>
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
			<Alert tone="danger" title="Profile Unavailable">
				Your student record could not be loaded.
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
