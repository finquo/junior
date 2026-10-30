"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { sileo as toast } from "sileo";
import { PhoneNumberZod } from "utils";
import { z } from "zod";
import { AvatarUpload } from "@/components/avatar-upload";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { authClient, useAuth } from "@/hooks/auth";

const profileFormSchema = z.object({
	name: z.string().trim().min(1, "Name cannot be empty"),
	phoneNumber: PhoneNumberZod.optional(),
	avatar: z.string().nullable(),
});

export default function ProfileEditPage() {
	const { data } = useAuth<true>();
	const [resetKey, setResetKey] = useState(0);

	const { mutate: updateProfile, isPending: isSaving } = useMutation({
		mutationKey: ["update-profile"],
		mutationFn: async ({
			name,
			image,
			phoneNumber,
		}: {
			name: string;
			image?: string | null;
			phoneNumber?: string;
		}) => {
			const { data: resData, error } = await authClient.updateUser({
				name: name.trim(),
				image: image === null ? null : image || undefined,
				phoneNumber: phoneNumber?.trim() || null,
			});

			if (error) throw error;

			return resData;
		},
		onSuccess: () => {
			toast.success({
				title: "Profile updated successfully",
			});
		},
		onError: (error) => {
			toast.error({
				title: error.message || "Failed to update profile",
			});
		},
	});

	const form = useForm({
		defaultValues: {
			name: data?.name ?? "",
			phoneNumber: data?.phoneNumber ?? undefined,
			avatar: (data?.image ?? null) as string | null,
		} as z.infer<typeof profileFormSchema>,
		validators: {
			onSubmit: profileFormSchema,
			onChange: profileFormSchema,
		},
		onSubmit: async ({ value }) => {
			updateProfile({
				name: value.name,
				phoneNumber: value.phoneNumber,
				image: value.avatar,
			});
		},
	});

	useEffect(() => {
		if (data) {
			form.reset({
				name: data.name ?? "",
				phoneNumber: data.phoneNumber ?? undefined,
				avatar: data.image ?? null,
			});
		}
	}, [data, form]);

	if (!data) {
		return <Spinner />;
	}

	const handleReset = () => {
		form.reset();
		setResetKey((k) => k + 1);
	};

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				e.stopPropagation();
				form.handleSubmit();
			}}
		>
			<Card>
				<CardHeader>
					<CardTitle>Edit Profile</CardTitle>
					<CardDescription>
						Update your personal details and avatar.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<FieldGroup>
						<form.Field
							name="avatar"
							children={(field) => (
								<Field>
									<AvatarUpload
										key={resetKey}
										defaultAvatar={data.image ?? undefined}
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
										<FieldLabel htmlFor={field.name}>Name</FieldLabel>
										<Input
											id={field.name}
											name={field.name}
											placeholder="Your name"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											aria-invalid={isInvalid}
											disabled={isSaving}
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

						<Field>
							<FieldLabel htmlFor="email">Email</FieldLabel>
							<Input id="email" value={data.email} disabled />
							<FieldDescription>
								Email cannot be edited directly
							</FieldDescription>
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
											disabled={isSaving}
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
					</FieldGroup>
				</CardContent>

				<form.Subscribe
					selector={(state) => [state.canSubmit, state.isDirty]}
					children={([canSubmit, isDirty]) => (
						<CardFooter className="justify-end">
							<Button
								type="button"
								variant="outline"
								onClick={handleReset}
								disabled={!isDirty || isSaving}
							>
								Reset
							</Button>
							<Button
								type="submit"
								disabled={!isDirty || isSaving || !canSubmit}
							>
								{isSaving && <Spinner />}
								Save
							</Button>
						</CardFooter>
					)}
				/>
			</Card>
		</form>
	);
}
