"use client";

import { useForm } from "@tanstack/react-form";
import { KeyRoundIcon } from "lucide-react";
import { z } from "zod";
import {
	AlertDialogCancel,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogMedia,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { GetFormZod } from "@/lib/utils";

const resetPasswordSchema = z.object({
	password: z.string().min(8, "Password must be at least 8 characters"),
});

export function ResetPasswordForm({
	mutate,
	userName,
}: {
	mutate: (newPassword: string) => void;
	userName: string;
}) {
	const form = useForm({
		defaultValues: {
			password: "1234567890",
		} as z.infer<typeof resetPasswordSchema>,
		validators: {
			onSubmit: resetPasswordSchema as GetFormZod<typeof resetPasswordSchema>,
		},
		onSubmit: ({ value }) => {
			mutate(value.password);
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
			<AlertDialogHeader>
				<AlertDialogMedia>
					<KeyRoundIcon />
				</AlertDialogMedia>
				<AlertDialogTitle>Reset password for {userName}?</AlertDialogTitle>
				<AlertDialogDescription>
					Enter a new password for this user. The default is 1234567890.
				</AlertDialogDescription>
			</AlertDialogHeader>
			<FieldGroup>
				<form.Field
					name="password"
					children={(field) => {
						const isInvalid =
							field.state.meta.isTouched && !field.state.meta.isValid;

						return (
							<Field>
								<FieldLabel htmlFor="reset-password">New password</FieldLabel>
								<Input
									id="reset-password"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									aria-invalid={isInvalid}
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
			</FieldGroup>
			<AlertDialogFooter>
				<AlertDialogCancel>Cancel</AlertDialogCancel>
				<Button type="submit">Reset</Button>
			</AlertDialogFooter>
		</form>
	);
}
