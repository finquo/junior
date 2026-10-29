"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { type Address, type Schooling, schoolingZod } from "backend/config";
import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { sileo as toast } from "sileo";
import {
	Countries,
	type CountryCodes,
	CountryZod,
	type CurrencyCodes,
	CurrencyZod,
	type LanguageCodes,
	Languages,
} from "utils";
import { z } from "zod";
import {
	Frame,
	FrameDescription,
	FrameHeader,
	FramePanel,
	FrameTitle,
} from "@/components/reui/frame";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
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
import { UserFormSelector } from "@/components/user-selector";
import { api, refetchAPIs } from "@/hooks/api";
import type { GetFormZod } from "@/lib/utils";
import { ProgramSelector } from "../_components/selector";

const createStudentSchema = z.object({
	name: z.string().trim().min(1, "Name is required"),
	email: z.string().trim().email("Please enter a valid email address"),
	password: z
		.string()
		.min(6, "Password must be at least 6 characters")
		.default("1234567890"),
	program: z.string().optional(),
	mentorId: z.string().optional(),
	supervisorId: z.string().optional(),
	schooling: schoolingZod.nullable().optional(),
	age: z.coerce.number().optional(),
	grade: z.coerce.number().optional(),
	country: CountryZod.nullable().optional(),
	currency: CurrencyZod.nullable().optional(),
	amount: z.coerce.number().default(0),
	remaining: z.coerce.number().default(0),
	languages: z.array(z.string()).default([]),
	address: z
		.object({
			line1: z.string().optional(),
			line2: z.string().optional(),
			city: z.string().optional(),
			state: z.string().optional(),
			postalCode: z.string().optional(),
			country: z.string().optional(),
		})
		.optional(),
});

type CreateStudentValues = z.infer<typeof createStudentSchema>;

export default function Page() {
	const router = useRouter();

	const { mutateAsync, isPending } = useMutation(
		api.core.student.create.mutationOptions({
			onSuccess: () => {
				refetchAPIs([api.core.student.list.queryKey()]);
				toast.success({ title: "Student created successfully" });
				router.push("/students");
			},
			onError: (err: { message?: string }) => {
				toast.error({ title: err.message || "Failed to create student" });
			},
		}),
	);

	const form = useForm({
		defaultValues: {
			name: "",
			email: "",
			password: "1234567890",
			program: "",
			mentorId: "",
			supervisorId: "",
			schooling: null,
			age: undefined,
			grade: undefined,
			country: "IN",
			currency: "INR",
			amount: 0,
			remaining: 0,
			languages: [],
			address: {},
		} as CreateStudentValues,
		validators: {
			onSubmit: createStudentSchema as GetFormZod<typeof createStudentSchema>,
		},
		onSubmit: async ({ value }) => {
			await mutateAsync({
				user: {
					name: value.name.trim(),
					email: value.email.trim().toLowerCase(),
				},
				student: {
					program: value.program || undefined,
					mentorId: value.mentorId || undefined,
					supervisorId: value.supervisorId || undefined,
					schooling: value.schooling ?? undefined,
					age: value.age,
					grade: value.grade,
					country: (value.country ?? "IN") as CountryCodes,
					currency: (value.currency ?? "INR") as CurrencyCodes,
					amount: value.amount,
					remaining: value.remaining,
					languages: value.languages as LanguageCodes[],
					address: (value.address ?? null) as Address | null,
				},
				password: value.password,
			});
		},
	});

	return (
		<Frame>
			<FrameHeader>
				<FrameTitle>Create New Student</FrameTitle>
				<FrameDescription>
					Add a student account and assign their program, mentor, supervisor,
					and details.
				</FrameDescription>
			</FrameHeader>
			<FramePanel>
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
										<FieldLabel htmlFor={field.name}>Full Name</FieldLabel>
										<Input
											id={field.name}
											name={field.name}
											placeholder="John Doe"
											value={field.state.value}
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
							name="email"
							children={(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>Email Address</FieldLabel>
										<Input
											id={field.name}
											name={field.name}
											type="email"
											placeholder="user@example.com"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) =>
												field.handleChange(e.target.value.toLowerCase())
											}
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
							name="password"
							children={(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>Password</FieldLabel>
										<Input
											id={field.name}
											name={field.name}
											type="text"
											placeholder="1234567890"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											aria-invalid={isInvalid}
											disabled={isPending}
										/>
										<FieldDescription>
											Default password is 1234567890. User can change it after
											logging in.
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
							name="program"
							children={(field) => (
								<ProgramSelector
									id={field.name}
									value={field.state.value}
									onValueChange={(val) => field.handleChange(val || undefined)}
									onSelect={(program) => {
										const country = form.state.values.country ?? "IN";
										const price = program.price?.[country as CountryCodes];
										if (price !== undefined) {
											form.setFieldValue("amount", price);
											form.setFieldValue("remaining", price);
										}
									}}
									disabled={isPending}
								/>
							)}
						/>

						<div className="grid grid-cols-2 gap-4">
							<form.Field
								name="amount"
								children={(field) => (
									<Field>
										<FieldLabel htmlFor={field.name}>Amount</FieldLabel>
										<Input
											id={field.name}
											name={field.name}
											type="number"
											value={field.state.value ?? ""}
											onBlur={field.handleBlur}
											onChange={(e) =>
												field.handleChange(
													e.target.value === "" ? 0 : Number(e.target.value),
												)
											}
											disabled={isPending}
										/>
									</Field>
								)}
							/>

							<form.Field
								name="remaining"
								children={(field) => (
									<Field>
										<FieldLabel htmlFor={field.name}>Remaining</FieldLabel>
										<Input
											id={field.name}
											name={field.name}
											type="number"
											value={field.state.value ?? ""}
											onBlur={field.handleBlur}
											onChange={(e) =>
												field.handleChange(
													e.target.value === "" ? 0 : Number(e.target.value),
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
														? undefined
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
														? undefined
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
								name="schooling"
								children={(field) => (
									<Field>
										<FieldLabel htmlFor={field.name}>Schooling</FieldLabel>
										<Select
											value={field.state.value ?? ""}
											onValueChange={(val: string) =>
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
						</div>

						<form.Field
							name="mentorId"
							children={(field) => (
								<UserFormSelector
									id={field.name}
									label="Mentor"
									value={field.state.value}
									onValueChange={(val) => field.handleChange(val ?? undefined)}
									api={api.core.teacher.list.queryOptions()}
									disabled={isPending}
								/>
							)}
						/>

						<form.Field
							name="supervisorId"
							children={(field) => (
								<UserFormSelector
									id={field.name}
									label="Supervisor"
									value={field.state.value}
									onValueChange={(val) => field.handleChange(val ?? undefined)}
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
																	current.filter((c: string) => c !== code),
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

						<form.Subscribe
							selector={(state) => [state.canSubmit, state.isDirty]}
							children={([canSubmit, isDirty]) => (
								<ButtonGroup>
									<Button variant="outline" asChild disabled={isPending}>
										<Link href="/students">Cancel</Link>
									</Button>
									<Button
										type="submit"
										disabled={!canSubmit || !isDirty || isPending}
									>
										{isPending ? <Spinner /> : <PlusIcon />}
										Create Student
									</Button>
								</ButtonGroup>
							)}
						/>
					</FieldGroup>
				</form>
			</FramePanel>
		</Frame>
	);
}
