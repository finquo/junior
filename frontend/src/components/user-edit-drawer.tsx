"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { roleEnumZod } from "backend/auth";
import { PenIcon } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { sileo as toast } from "sileo";
import { PhoneNumberZod } from "utils";
import { z } from "zod";
import { AvatarUpload } from "@/components/avatar-upload";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerInner,
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
import { api, queryClient } from "@/hooks/api";
import { authClient } from "@/hooks/auth";
import type { Role } from "@/lib/auth";
import { rolesObject } from "@/lib/role";
import type { GetFormZod } from "@/lib/utils";

const editUserSchema = z.object({
	name: z.string().trim().min(1, "Name is required"),
	username: z.string().optional(),
	email: z.string().trim().email("Please enter a valid email address"),
	phoneNumber: PhoneNumberZod.optional(),
	role: roleEnumZod.optional(),
	image: z.string().nullable().optional(),
});

type EditUserFormValues = z.infer<typeof editUserSchema>;

const toUsername = (str: string) => {
	return str
		.toLowerCase()
		.trim()
		.replace(/\s+/g, ".")
		.replace(/[^a-z0-9.]/g, "");
};

interface UserEditDrawerProps {
	userId: string;
	userData?: {
		name?: string | null;
		email?: string | null;
		phoneNumber?: string | null;
		role?: Role | string | null;
		image?: string | null;
	} | null;
	children: React.ReactElement;
	onSuccess?: () => void;
}

export function UserEditDrawer({
	userId,
	userData,
	children,
	onSuccess,
}: UserEditDrawerProps) {
	const [open, setOpen] = useState(false);

	const { data: user = userData } = useQuery({
		...api.common.getUser.queryOptions({
			input: { id: userId },
		}),
		initialData: userData as any,
		enabled: open && Boolean(userId) && !userData,
	});

	const initialName = user?.name ?? "";
	const initialEmail = user?.email ?? "";
	const initialPhone = user?.phoneNumber ?? undefined;
	const initialRole = (user?.role as Role) ?? "user";
	const initialImage = user?.image ?? null;

	const [useFinquoEmail, setUseFinquoEmail] = useState(
		initialEmail.toLowerCase().endsWith("@finquo.ai"),
	);
	const [isUsernameCustom, setIsUsernameCustom] = useState(false);

	const { mutateAsync, isPending } = useMutation({
		mutationFn: async (values: EditUserFormValues) => {
			const { data, error } = await authClient.admin.updateUser({
				userId,
				data: {
					name: values.name.trim(),
					email: values.email.trim().toLowerCase(),
					phoneNumber: values.phoneNumber?.trim() || null,
					role: values.role as Role,
					image: values.image === null ? null : values.image || undefined,
				},
			});

			if (error) {
				throw new Error(error.message || "Failed to update user profile");
			}

			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries();
			toast.success({ title: "User profile updated successfully" });
			setOpen(false);
			onSuccess?.();
		},
	});

	const form = useForm({
		defaultValues: {
			name: initialName,
			username: initialEmail.includes("@")
				? initialEmail.split("@")[0]
				: toUsername(initialName),
			email: initialEmail,
			phoneNumber: initialPhone,
			role: initialRole,
			image: initialImage,
		} as EditUserFormValues,
		validators: {
			onSubmit: editUserSchema as GetFormZod<typeof editUserSchema>,
		},
		onSubmit: async ({ value }) => {
			await mutateAsync(value);
		},
	});

	useEffect(() => {
		if (open) {
			const isFinquo = initialEmail.toLowerCase().endsWith("@finquo.ai");
			setUseFinquoEmail(isFinquo);
			setIsUsernameCustom(false);
			form.reset({
				name: initialName,
				username: initialEmail.includes("@")
					? initialEmail.split("@")[0]
					: toUsername(initialName),
				email: initialEmail,
				phoneNumber: initialPhone,
				role: initialRole,
				image: initialImage,
			});
		}
	}, [
		open,
		initialName,
		initialEmail,
		initialPhone,
		initialRole,
		initialImage,
		form,
	]);

	return (
		<Drawer open={open} onOpenChange={setOpen}>
			<DrawerTrigger asChild>{children}</DrawerTrigger>
			<DrawerContent>
				<DrawerHeader>
					<DrawerTitle>Edit User Profile</DrawerTitle>
					<DrawerDescription>
						Update name, email, phone, role, and avatar for this user.
					</DrawerDescription>
				</DrawerHeader>

				<DrawerInner asChild>
					<form
						onSubmit={(e) => {
							e.preventDefault();
							e.stopPropagation();
							form.handleSubmit();
						}}
					>
						<FieldGroup>
							<form.Field
								name="image"
								children={(field) => (
									<Field>
										<FieldLabel>Avatar</FieldLabel>
										<AvatarUpload
											defaultAvatar={field.state.value ?? undefined}
											onFileChange={(url) => field.handleChange(url)}
										/>
									</Field>
								)}
							/>

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
									id="use-finquo-email-edit"
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
								<FieldLabel htmlFor="use-finquo-email-edit">
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
												Determines user permissions and access rights.
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

						<DrawerFooter>
							<Button type="submit" disabled={isPending}>
								{isPending ? <Spinner /> : <PenIcon />}
								Save Changes
							</Button>
							<DrawerClose asChild>
								<Button variant="outline" type="button" disabled={isPending}>
									Close
								</Button>
							</DrawerClose>
						</DrawerFooter>
					</form>
				</DrawerInner>
			</DrawerContent>
		</Drawer>
	);
}

export default UserEditDrawer;
