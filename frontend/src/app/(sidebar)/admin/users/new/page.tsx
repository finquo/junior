"use client";

import { type StandardSchemaV1, useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { roleEnumZod } from "backend/auth";
import { UserPlusIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { sileo as toast } from "sileo";
import { z } from "zod";
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
import type { Role } from "@/lib/auth";
import { rolesObject } from "@/lib/role";
import type { GetFormZod } from "@/lib/utils";

const createUserSchema = z.object({
	name: z.string().trim().min(1, "Name is required"),
	username: z.string().optional(),
	email: z.string().trim().email("Please enter a valid email address"),
	password: z
		.string()
		.min(6, "Password must be at least 6 characters")
		.default("1234567890"),
	role: roleEnumZod.optional(),
});

const toUsername = (str: string) => {
	return str
		.toLowerCase()
		.trim()
		.replace(/\s+/g, ".")
		.replace(/[^a-z0-9.]/g, "");
};

export default function CreateUserPage() {
	const router = useRouter();
	const [useFinquoEmail, setUseFinquoEmail] = useState(false);
	const [isUsernameCustom, setIsUsernameCustom] = useState(false);

	const { mutateAsync, isPending } = useMutation(
		api.admin.createAccount.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries();
				toast.success({ title: "User created successfully" });
				router.push("/admin/users");
			},
			onError: (err) => {
				toast.error({ title: err.message || "Failed to create user" });
			},
		}),
	);

	const form = useForm({
		defaultValues: {
			name: "",
			email: "",
			username: "",
			password: "1234567890",
			role: "user",
		} as z.infer<typeof createUserSchema>,
		validators: {
			onSubmit: createUserSchema as GetFormZod<typeof createUserSchema>,
		},
		onSubmit: async ({ value }) => {
			await mutateAsync({
				name: value.name.trim(),
				email: value.email.trim().toLowerCase(),
				password: value.password,
				role: value.role as Role,
			});
		},
	});

	return (
		<div className="mx-auto max-w-xl py-6">
			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
			>
				<Card>
					<CardHeader>
						<CardTitle className="text-xl">Create New User</CardTitle>
						<CardDescription>
							Add a new user to the system and assign their role.
						</CardDescription>
					</CardHeader>
					<CardContent>
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
												value={field.state.value}
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
											<FieldLabel htmlFor={field.name}>
												Email Address
											</FieldLabel>
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
									id="use-finquo-email"
									checked={useFinquoEmail}
									onCheckedChange={(checked) => {
										const isChecked = Boolean(checked);
										setUseFinquoEmail(isChecked);
										if (isChecked) {
											const uName = form
												.getFieldValue("username")
												?.toLowerCase();
											form.setFieldValue(
												"email",
												uName ? `${uName}@finquo.ai` : "",
											);
										}
									}}
									disabled={isPending}
								/>
								<FieldLabel htmlFor="use-finquo-email">
									Use @finquo.ai email (
									{form.state.values.username
										? `${form.state.values.username.toLowerCase()}@finquo.ai`
										: "...@finquo.ai"}
									)
								</FieldLabel>
							</Field>

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
												type="password"
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
								name="role"
								children={(field) => {
									const isInvalid =
										field.state.meta.isTouched && !field.state.meta.isValid;
									return (
										<Field data-invalid={isInvalid}>
											<FieldLabel htmlFor={field.name}>Role</FieldLabel>
											<Select
												items={rolesObject}
												value={field.state.value}
												disabled={isPending}
												onValueChange={(val) => {
													if (val) field.handleChange(val as Role);
												}}
											>
												<SelectTrigger id={field.name}>
													<SelectValue placeholder="Select a role" />
												</SelectTrigger>
												<SelectContent>
													<SelectGroup>
														{rolesObject.map((item) => (
															<SelectItem key={item.value} value={item.value}>
																{item.label}
															</SelectItem>
														))}
													</SelectGroup>
												</SelectContent>
											</Select>
											<FieldDescription>
												Determines the user permissions and access rights.
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
						</FieldGroup>
					</CardContent>
					<CardFooter className="flex justify-end gap-3 pt-6">
						<Button
							variant="outline"
							render={<Link href="/admin/users" />}
							nativeButton={false}
							disabled={isPending}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isPending}>
							{isPending ? <Spinner className="size-4" /> : <UserPlusIcon />}
							Create User
						</Button>
					</CardFooter>
				</Card>
			</form>
		</div>
	);
}
