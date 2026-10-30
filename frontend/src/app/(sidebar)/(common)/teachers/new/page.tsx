"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { PlusIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { sileo as toast } from "sileo";
import type { LanguageCodes } from "utils";
import { Languages, PhoneNumberZod } from "utils";
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
import { Spinner } from "@/components/ui/spinner";
import { UserFormSelector } from "@/components/user-selector";
import { api, refetchAPIs } from "@/hooks/api";
import type { GetFormZod } from "@/lib/utils";

const createTeacherSchema = z.object({
	name: z.string().trim().min(1, "Name is required"),
	email: z.string().trim().email("Please enter a valid email address"),
	phoneNumber: PhoneNumberZod.optional(),
	password: z
		.string()
		.min(6, "Password must be at least 6 characters")
		.default("1234567890"),
	supervisorId: z.string().optional(),
	languages: z.array(z.string()).default([]),
	experiences: z
		.array(
			z.object({
				title: z.string(),
				organization: z.string(),
				description: z.string().optional(),
				startedAt: z.string(),
				endedAt: z.string().optional(),
				createdAt: z.string(),
			}),
		)
		.default([]),
});

type CreateTeacherValues = z.infer<typeof createTeacherSchema>;

export default function Page() {
	const router = useRouter();

	const { mutateAsync, isPending } = useMutation(
		api.core.teacher.create.mutationOptions({
			onSuccess: () => {
				refetchAPIs([api.core.teacher.list.queryKey()]);
				toast.success({ title: "Teacher created successfully" });
				router.push("/teachers");
			},
			onError: (err: { message?: string }) => {
				toast.error({ title: err.message || "Failed to create teacher" });
			},
		}),
	);

	const form = useForm({
		defaultValues: {
			name: "",
			email: "",
			phoneNumber: undefined,
			password: "1234567890",
			supervisorId: "",
			languages: [],
			experiences: [],
		} as CreateTeacherValues,
		validators: {
			onSubmit: createTeacherSchema as GetFormZod<typeof createTeacherSchema>,
		},
		onSubmit: async ({ value }) => {
			await mutateAsync({
				user: {
					name: value.name.trim(),
					email: value.email.trim().toLowerCase(),
					phoneNumber: value.phoneNumber?.trim() || undefined,
				},
				teacher: {
					supervisorId: value.supervisorId || undefined,
					languages: value.languages as LanguageCodes[],
					experiences: value.experiences,
				},
				password: value.password,
			});
		},
	});

	return (
		<Frame>
			<FrameHeader>
				<FrameTitle>Create New Teacher</FrameTitle>
				<FrameDescription>
					Add a teacher account and assign their supervisor, languages, and
					experience.
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
											onChange={(e) => field.handleChange(e.target.value || undefined)}
											aria-invalid={isInvalid}
											disabled={isPending}
										/>
										<FieldDescription>
											International format, e.g. +919876543210.
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
							name="supervisorId"
							children={(field) => (
								<UserFormSelector
									id={field.name}
									label="Supervisor"
									value={field.state.value}
									onValueChange={(val) => field.handleChange(val || undefined)}
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
																	current.filter((c: string) => c !== code),
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

						<FieldSet>
							<FieldLegend>Experiences</FieldLegend>
							<FieldDescription>
								Manage past teaching experiences.
							</FieldDescription>
							<form.Field
								name="experiences"
								mode="array"
								children={(field) => {
									const items = field.state.value ?? [];
									return (
										<div className="space-y-3">
											{items.length === 0 ? (
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
											) : (
												<>
													{items.map((_, index) => (
														<ExperienceItem
															key={index}
															index={index}
															form={form}
															isPending={isPending}
															onRemove={() => field.removeValue(index)}
														/>
													))}
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
												</>
											)}
										</div>
									);
								}}
							/>
						</FieldSet>

						<form.Subscribe
							selector={(state) => [state.canSubmit, state.isDirty]}
							children={([canSubmit, isDirty]) => (
								<ButtonGroup>
									<Button variant="outline" asChild disabled={isPending}>
										<Link href="/teachers">Cancel</Link>
									</Button>
									<Button
										type="submit"
										disabled={!canSubmit || !isDirty || isPending}
									>
										{isPending ? <Spinner /> : <PlusIcon />}
										Create Teacher
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
		<div className="space-y-3 rounded-lg border p-4">
			<div className="flex items-start justify-between">
				<span className="font-medium text-muted-foreground text-sm">
					Experience #{index + 1}
				</span>
				<Button
					type="button"
					variant="destructive"
					size="icon-xs"
					onClick={onRemove}
					disabled={isPending}
				>
					<Trash2Icon />
				</Button>
			</div>
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
		</div>
	);
}
