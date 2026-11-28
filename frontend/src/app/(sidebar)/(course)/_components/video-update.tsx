"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { SaveIcon } from "lucide-react";
import { sileo as toast } from "sileo";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
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
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { api, refetchAPIs } from "@/hooks/api";
import type { API_Returns } from "@/lib/api";
import type { GetFormZod } from "@/lib/utils";
import { videoUpdateFormSchema } from "./video-schema";

type VideoRecord = API_Returns["core"]["video"]["list"][number];

export function VideoUpdateForm({
	courseId,
	video,
	children,
}: {
	courseId: string;
	video: VideoRecord;
	children: React.ReactElement;
}) {
	const invalidate = () => {
		refetchAPIs([
			api.core.video.list.queryKey({ input: { course: courseId } }),
			api.core.module.list.queryKey({ input: { course: courseId } }),
			api.core.course.get.queryKey({ input: { id: courseId } }),
		]);
	};

	const { isPending, mutateAsync } = useMutation(
		api.core.video.update.mutationOptions({
			onSuccess: () => {
				invalidate();
				toast.success({ title: "Video updated" });
			},
			onError: (err) => {
				toast.error({ title: err.message || "Failed to update video" });
			},
		}),
	);

	const form = useForm({
		defaultValues: {
			name: video.name,
			description: video.description ?? undefined,
		} as z.infer<typeof videoUpdateFormSchema>,
		validators: {
			onSubmit: videoUpdateFormSchema as GetFormZod<
				typeof videoUpdateFormSchema
			>,
		},
		onSubmit: async ({ value }) => {
			await mutateAsync({
				id: video.id,
				name: value.name.trim(),
				description: value.description?.trim() || null,
			});
		},
	});

	return (
		<Drawer>
			<DrawerTrigger asChild>{children}</DrawerTrigger>
			<DrawerContent>
				<DrawerHeader>
					<DrawerTitle>Edit Video</DrawerTitle>
					<DrawerDescription>Update video metadata.</DrawerDescription>
				</DrawerHeader>
				<DrawerInner>
					<form
						id={`video-form-${video.id}`}
						onSubmit={(event) => {
							event.preventDefault();
							event.stopPropagation();
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
											<FieldLabel htmlFor={field.name}>Video Name</FieldLabel>
											<Input
												id={field.name}
												name={field.name}
												placeholder="What is compounding?"
												value={field.state.value ?? ""}
												onBlur={field.handleBlur}
												onChange={(event) =>
													field.handleChange(event.target.value)
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
								name="description"
								children={(field) => (
									<Field>
										<FieldLabel htmlFor={field.name}>Description</FieldLabel>
										<Textarea
											id={field.name}
											name={field.name}
											placeholder="What this video covers..."
											value={field.state.value ?? ""}
											onBlur={field.handleBlur}
											onChange={(event) =>
												field.handleChange(event.target.value || undefined)
											}
											disabled={isPending}
										/>
										<FieldDescription>
											Optional video description.
										</FieldDescription>
									</Field>
								)}
							/>
						</FieldGroup>
					</form>
				</DrawerInner>
				<DrawerFooter>
					<DrawerClose asChild>
						<Button variant="outline" disabled={isPending}>
							Cancel
						</Button>
					</DrawerClose>
					<form.Subscribe
						selector={(state) => [state.canSubmit, state.isDirty]}
						children={([canSubmit, isDirty]) => (
							<Button
								type="submit"
								form={`video-form-${video.id}`}
								disabled={!canSubmit || !isDirty || isPending}
							>
								{isPending ? <Spinner /> : <SaveIcon />}
								Save Changes
							</Button>
						)}
					/>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
}
