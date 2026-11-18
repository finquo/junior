"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { FeedbackTypeZod } from "backend/db";
import { MessageSquarePlusIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { sileo as toast } from "sileo";
import { z } from "zod";
import { UserSelector } from "@/components/custom/user-selector";
import {
	Frame,
	FrameDescription,
	FrameHeader,
	FramePanel,
	FrameTitle,
} from "@/components/reui/frame";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
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
import { Textarea } from "@/components/ui/textarea";
import { api, refetchAPIs } from "@/hooks/api";
import type { GetFormZod } from "@/lib/utils";

const createFeedbackSchema = z.object({
	content: z
		.string()
		.trim()
		.min(1, "Content is required")
		.max(2000, "Keep the content under 2000 characters"),
	type: FeedbackTypeZod,
	refTable: z.string().optional(),
	refId: z.string().min(1).optional(),
	userId: z.string().optional(),
});

type CreateFeedbackValues = z.infer<typeof createFeedbackSchema>;

const refTables = [
	"slot",
	"lesson",
	"material",
	"payment",
	"program",
	"media",
	"user",
] as const;

export default function Page() {
	const router = useRouter();

	const { mutateAsync, isPending } = useMutation(
		api.feedback.addFeedback.mutationOptions({
			onSuccess: () => {
				refetchAPIs([api.feedback.list.queryKey()]);
				toast.success({ title: "Feedback created" });
				router.push("/feedbacks");
			},
			onError: (error) =>
				toast.error({
					title: error.message || "Failed to create feedback",
				}),
		}),
	);

	const form = useForm({
		defaultValues: {
			type: undefined,
			refTable: undefined,
			refId: undefined,
			userId: undefined,
		} as Partial<CreateFeedbackValues>,
		validators: {
			onSubmit: createFeedbackSchema as GetFormZod<typeof createFeedbackSchema>,
		},
		onSubmit: async ({ value }) => {
			if (!value.content || !value.type) return;

			await mutateAsync({
				content: value.content,
				type: value.type,
				ref:
					value.refTable && value.refId
						? `${value.refTable}:${value.refId}`
						: undefined,
				userId: value.userId,
			});
		},
	});

	return (
		<Frame>
			<FrameHeader>
				<FrameTitle>Create New Feedback</FrameTitle>
				<FrameDescription>
					Record feedback on behalf of a user, or submit an anonymous entry.
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
							name="content"
							children={(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>Content</FieldLabel>
										<Textarea
											id={field.name}
											name={field.name}
											placeholder="What went wrong, or what should we improve?"
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
							name="type"
							children={(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>Type</FieldLabel>
										<Select
											value={field.state.value}
											onValueChange={(val) =>
												field.handleChange(
													val as (typeof FeedbackTypeZod.options)[number],
												)
											}
											disabled={isPending}
										>
											<SelectTrigger
												id={field.name}
												className="w-full min-w-[200px]"
											>
												<SelectValue placeholder="Select type" />
											</SelectTrigger>
											<SelectContent>
												<SelectGroup>
													{FeedbackTypeZod.options.map((type) => (
														<SelectItem key={type} value={type}>
															<span className="capitalize">{type}</span>
														</SelectItem>
													))}
												</SelectGroup>
											</SelectContent>
										</Select>
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
							selector={(state) => state.values}
							children={(values) => (
								<FieldGroup>
									<Field>
										<FieldLabel htmlFor="ref-table">
											Reference (optional)
										</FieldLabel>
										<div className="flex gap-2">
											<Select
												value={values.refTable}
												onValueChange={(table) =>
													form.setFieldValue("refTable", table || undefined)
												}
												disabled={isPending}
											>
												<SelectTrigger
													id="ref-table"
													className="w-full min-w-[200px]"
												>
													<SelectValue placeholder="Select table" />
												</SelectTrigger>
												<SelectContent>
													<SelectGroup>
														{refTables.map((table) => (
															<SelectItem key={table} value={table}>
																{table}
															</SelectItem>
														))}
													</SelectGroup>
												</SelectContent>
											</Select>
											<Input
												id="ref-id"
												placeholder="id"
												value={values.refId ?? ""}
												onChange={(e) =>
													form.setFieldValue(
														"refId",
														e.target.value || undefined,
													)
												}
												disabled={isPending}
											/>
										</div>
										<FieldDescription>
											Context of the feedback, e.g. slot + demo becomes
											"slot:demo".
										</FieldDescription>
									</Field>
								</FieldGroup>
							)}
						/>

						<form.Subscribe
							selector={(state) => state.values.userId}
							children={(userId) => (
								<UserSelector
									name="userId"
									label="User (optional)"
									value={userId}
									onChange={(id) => form.setFieldValue("userId", id)}
									search={(query) =>
										api.core.user.search.queryOptions({ input: { query } })
									}
								/>
							)}
						/>

						<form.Subscribe
							selector={(state) => [state.canSubmit, state.isDirty]}
							children={([canSubmit, isDirty]) => (
								<ButtonGroup>
									<Button variant="outline" asChild disabled={isPending}>
										<Link href="/feedbacks">Cancel</Link>
									</Button>
									<Button
										type="submit"
										disabled={!canSubmit || !isDirty || isPending}
									>
										{isPending ? <Spinner /> : <MessageSquarePlusIcon />}
										Create Feedback
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
