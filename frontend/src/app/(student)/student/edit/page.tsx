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
import { sileo as toast } from "sileo";
import { Countries, type CountryCodes } from "utils";
import { useState } from "react";
import type { z } from "zod";
import Loader from "@/components/loader";
import {
	Frame,
	FrameDescription,
	FrameHeader,
	FramePanel,
	FrameTitle,
} from "@/components/reui/frame";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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
	// Addresses are optional: all fields blank means no address (saved as null).
	address: addressZod.partial(),
	currentAddress: addressZod.partial(),
});

type StudentEditValues = z.infer<typeof studentEditSchema>;
type AddressFormValues = StudentEditValues["address"];

function toAddressValues(address: Address | null | undefined): AddressFormValues {
	return {
		line1: address?.line1,
		line2: address?.line2,
		city: address?.city,
		state: address?.state,
		postalCode: address?.postalCode,
		country: address?.country,
	};
}

function toFormValues(student: StudentData): StudentEditValues {
	return {
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

	return { line1, line2: line2?.trim() || undefined, city, state, postalCode, country };
};

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

	const [sameAsPermanent, setSameAsPermanent] = useState(false);

	const form = useForm({
		defaultValues: toFormValues(student),
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
			<FieldGroup>
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
											e.target.value === "" ? null : Number(e.target.value),
										)
									}
									disabled={isPending}
								/>
								<FieldDescription>Your current age</FieldDescription>
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
											e.target.value === "" ? null : Number(e.target.value),
										)
									}
									disabled={isPending}
								/>
								<FieldDescription>
									The grade you are studying in
								</FieldDescription>
							</Field>
						)}
					/>
				</div>

				<div className="grid grid-cols-2 gap-4">
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
									<SelectTrigger
										id={field.name}
										className="w-full min-w-[200px]"
									>
										<SelectValue placeholder="Select schooling" />
									</SelectTrigger>
									<SelectContent>
										<SelectGroup>
											{schoolingZod.options.map((school) => (
												<SelectItem key={school} value={school}>
													{snakeToTitleCase(school)}
												</SelectItem>
											))}
										</SelectGroup>
									</SelectContent>
								</Select>
								<FieldDescription>Your school board</FieldDescription>
							</Field>
						)}
					/>

					<form.Field
						name="country"
						children={(field) => (
							<Field>
								<FieldLabel htmlFor={field.name}>Country</FieldLabel>
								<Select
									value={field.state.value ?? ""}
									onValueChange={(val) =>
										field.handleChange((val as CountryCodes) || null)
									}
									disabled={isPending}
								>
									<SelectTrigger
										id={field.name}
										className="w-full min-w-[200px]"
									>
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
								<FieldDescription>Where you live</FieldDescription>
							</Field>
						)}
					/>
				</div>

				<FieldSet>
					<FieldLegend>Address</FieldLegend>
					<FieldDescription>
						Where the institute can reach your family
					</FieldDescription>

					{form.state.values.address.line1 ||
					form.state.values.address.city ||
					form.state.values.address.postalCode ||
					form.state.values.address.country ? (
						<FieldGroup>
							<form.Field
								name="address.line1"
								children={(field) => {
									const isInvalid =
										field.state.meta.isTouched && !field.state.meta.isValid;
									return (
										<Field data-invalid={isInvalid}>
											<FieldLabel htmlFor={field.name}>
												Street Line 1
											</FieldLabel>
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
					) : (
						<Alert>
							<AlertTitle>No address saved yet</AlertTitle>
							<AlertDescription>
								Add an address so the institute can reach your family.
							</AlertDescription>
						</Alert>
					)}
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

					{!sameAsPermanent && (
						<FieldGroup>
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
					)}
				</FieldSet>
			</FieldGroup>

			<form.Subscribe
				selector={(state) => [state.canSubmit, state.isDirty]}
				children={([canSubmit, isDirty]) => (
					<div className="flex justify-end gap-3">
						<Button
							type="button"
							variant="outline"
							onClick={() => form.reset(toFormValues(student))}
							disabled={!isDirty || isPending}
						>
							Reset
						</Button>
						<Button
							type="submit"
							disabled={!isDirty || isPending || !canSubmit}
						>
							{isPending && <Spinner />}
							Save
						</Button>
					</div>
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
		<Frame>
			<FrameHeader>
				<FrameTitle>Edit Profile</FrameTitle>
				<FrameDescription>
					Update your student details and address
				</FrameDescription>
			</FrameHeader>
			<FramePanel>
				<StudentEditForm student={record} />
			</FramePanel>
		</Frame>
	);
}
