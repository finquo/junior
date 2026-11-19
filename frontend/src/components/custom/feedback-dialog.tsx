"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { FeedbackTypeZod, InsertFeedbackSchema } from "backend/db";
import { CheckIcon } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { sileo as toast } from "sileo";
import type { z } from "zod";
import { Button } from "@/components/arc/button/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogTrigger,
} from "@/components/arc/dialog/dialog";
import { Select } from "@/components/arc/select/select";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/hooks/api";
import { useAuth } from "@/hooks/auth";
import type { GetFormZod } from "@/lib/utils";

const feedbackSchema = InsertFeedbackSchema.pick({ content: true, type: true });

type FeedbackType = z.infer<typeof feedbackSchema>["type"];

/** Lightweight feedback form for end users: the who and the where are already known, so only type and content are asked. */
export function FeedbackDialog({
	type,
	reference,
	open: openProp,
	onOpenChange,
	children,
}: {
	type: FeedbackType;
	reference?: string;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	children?: React.ReactElement;
}) {
	const { data: user } = useAuth();
	const [uncontrolled, setUncontrolled] = useState(false);
	const open = openProp ?? uncontrolled;

	const addFeedback = useMutation(
		api.feedback.addFeedback.mutationOptions({
			onSuccess: () => {
				toast.success({ title: "Thanks for the feedback" });
				setOpen(false);
			},
			onError: (error) =>
				toast.error({ title: error.message || "Could not send feedback" }),
		}),
	);

	const form = useForm({
		defaultValues: { type } as Partial<z.infer<typeof feedbackSchema>>,
		validators: {
			onSubmit: feedbackSchema as GetFormZod<typeof feedbackSchema>,
		},
		onSubmit: async ({ value }) => {
			if (!value.content || !value.type) return;

			await addFeedback.mutateAsync({
				content: value.content,
				type: value.type,
				ref: reference,
				userId: user?.id,
			});
		},
	});

	function setOpen(next: boolean) {
		if (openProp === undefined) setUncontrolled(next);
		onOpenChange?.(next);
		if (next) form.reset({ type });
	}

	return (
		<Dialog modal={false} open={open} onOpenChange={setOpen}>
			{children && <DialogTrigger asChild>{children}</DialogTrigger>}
			<DialogContent
				title="Send feedback"
				description="Tell us what went wrong, or what we could do better."
				// Non-modal: focus returning to the opener (the dock menu closing) must not dismiss it,
				// and skipping Radix's body pointer-events lock avoids leaving the page unclickable.
				onFocusOutside={(event) => event.preventDefault()}
			>
				<form
					onSubmit={(event) => {
						event.preventDefault();
						event.stopPropagation();
						form.handleSubmit();
					}}
				>
					<FieldGroup>
						<form.Field
							name="type"
							children={(field) => (
								<Select
									label="Type"
									id={field.name}
									value={field.state.value}
									onValueChange={(value) =>
										field.handleChange(value as FeedbackType)
									}
									options={FeedbackTypeZod.options.map((option) => ({
										value: option,
										label: option,
									}))}
									disabled={addFeedback.isPending}
								/>
							)}
						/>
						<form.Field
							name="content"
							children={(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;

								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>What happened?</FieldLabel>
										<Textarea
											id={field.name}
											name={field.name}
											placeholder="Describe the issue or your suggestion..."
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(event) =>
												field.handleChange(event.target.value)
											}
											aria-invalid={isInvalid}
											disabled={addFeedback.isPending}
										/>
										{isInvalid && (
											<FieldError
												errors={field.state.meta.errors.map((error) =>
													typeof error === "string"
														? { message: error }
														: error,
												)}
											/>
										)}
									</Field>
								);
							}}
						/>

						<DialogFooter>
							<Button
								type="button"
								variant="secondary"
								onClick={() => setOpen(false)}
								disabled={addFeedback.isPending}
							>
								Cancel
							</Button>
							<Button type="submit" loading={addFeedback.isPending}>
								<CheckIcon />
								Send feedback
							</Button>
						</DialogFooter>
					</FieldGroup>
				</form>
			</DialogContent>
		</Dialog>
	);
}
