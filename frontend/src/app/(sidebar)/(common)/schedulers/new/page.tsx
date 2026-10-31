"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { UserPlusIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { sileo as toast } from "sileo";
import { PhoneNumberZod } from "utils";
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
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { api, refetchAPIs } from "@/hooks/api";
import type { GetFormZod } from "@/lib/utils";

const createSchedulerSchema = z.object({
	name: z.string().trim().min(1, "Name is required"),
	username: z.string().optional(),
	email: z.string().trim().email("Please enter a valid email address"),
	phoneNumber: PhoneNumberZod.optional(),
	password: z
		.string()
		.min(6, "Password must be at least 6 characters")
		.default("1234567890"),
});

const toUsername = (str: string) => {
	return str
		.toLowerCase()
		.trim()
		.replace(/\s+/g, ".")
		.replace(/[^a-z0-9.]/g, "");
};

type CreateSchedulerValues = z.infer<typeof createSchedulerSchema>;

export default function Page() {
	const router = useRouter();
	const [useFinquoEmail, setUseFinquoEmail] = useState(false);
	const [isUsernameCustom, setIsUsernameCustom] = useState(false);

	const { mutateAsync, isPending } = useMutation(
		api.core.scheduler.create.mutationOptions({
			onSuccess: () => {
				refetchAPIs([api.core.scheduler.list.queryKey()]);
				toast.success({ title: "Scheduler created successfully" });
				router.push("/schedulers");
			},
			onError: (err: { message?: string }) => {
				toast.error({ title: err.message || "Failed to create scheduler" });
			},
		}),
	);

	const form = useForm({
		defaultValues: {
			password: "1234567890",
		} as CreateSchedulerValues,
		validators: {
			onSubmit: createSchedulerSchema as GetFormZod<
				typeof createSchedulerSchema
			>,
		},
		onSubmit: async ({ value }) => {
			await mutateAsync({
				user: {
					name: value.name.trim(),
					email: value.email.trim().toLowerCase(),
					phoneNumber: value.phoneNumber?.trim() || undefined,
				},
				password: value.password,
			});
		},
	});

	return (
		<Frame>
			<FrameHeader>
				<FrameTitle>Create New Scheduler</FrameTitle>
				<FrameDescription>
					Add a scheduler account who will manage teachers and students.
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
											onChange={(e) => {
												const newName = e.target.value;
												field.handleChange(newName);
												if (!isUsernameCustom) {
													const derived = toUsername(newName);
													form.setFieldValue("username", derived);
													if (useFinquoEmail) {
														form.setFieldValue(
															"email",
															derived ? `${derived}@finquo.ai` : "",
														);
													}
												}
											}}
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
							name="username"
							children={(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>Username</FieldLabel>
										<Input
											id={field.name}
											name={field.name}
											placeholder="john.doe"
											value={field.state.value ?? ""}
											onBlur={field.handleBlur}
											onChange={(e) => {
												setIsUsernameCustom(true);
												const newUsername = e.target.value
													.toLowerCase()
													.replace(/\s+/g, ".")
													.replace(/[^a-z0-9.]/g, "");
												field.handleChange(newUsername);
												if (useFinquoEmail) {
													form.setFieldValue(
														"email",
														newUsername ? `${newUsername}@finquo.ai` : "",
													);
												}
											}}
											aria-invalid={isInvalid}
											disabled={isPending}
										/>
										<FieldDescription>
											Derived automatically from name, but can be customized.
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
											disabled={isPending || useFinquoEmail}
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

						<Field orientation="horizontal">
							<Checkbox
								id="use-finquo-email-scheduler"
								checked={useFinquoEmail}
								onCheckedChange={(checked) => {
									const isChecked = Boolean(checked);
									setUseFinquoEmail(isChecked);
									if (isChecked) {
										const uName = form.getFieldValue("username")?.toLowerCase();
										form.setFieldValue(
											"email",
											uName ? `${uName}@finquo.ai` : "",
										);
									}
								}}
								disabled={isPending}
							/>
							<FieldLabel htmlFor="use-finquo-email-scheduler">
								Use @finquo.ai email (
								{form.state.values.username
									? `${form.state.values.username.toLowerCase()}@finquo.ai`
									: "...@finquo.ai"}
								)
							</FieldLabel>
						</Field>

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

						<form.Subscribe
							selector={(state) => [state.canSubmit, state.isDirty]}
							children={([canSubmit, isDirty]) => (
								<ButtonGroup>
									<Button variant="outline" asChild disabled={isPending}>
										<Link href="/schedulers">Cancel</Link>
									</Button>
									<Button
										type="submit"
										disabled={!canSubmit || !isDirty || isPending}
									>
										{isPending ? <Spinner /> : <UserPlusIcon />}
										Create Scheduler
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
