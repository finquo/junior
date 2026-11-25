"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { InsertVideoSchema } from "backend/db";
import { PlusIcon, SaveIcon } from "lucide-react";
import { sileo as toast } from "sileo";
import { z } from "zod";
import { ModuleSelector } from "@/components/custom/course-selector";
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

type VideoRecord = API_Returns["core"]["video"]["list"][number];

const videoFormSchema = InsertVideoSchema.pick({
	name: true,
	description: true,
}).extend({ module: z.string() });

export function VideoForm({
	courseId,
	moduleId,
	video,
	children,
}: {
	courseId: string;
	moduleId?: string;
	video?: VideoRecord;
	children: React.ReactElement;
}) {
	const invalidate = () => {
		refetchAPIs([
			api.core.video.list.queryKey({ input: { course: courseId } }),
			api.core.module.list.queryKey({ input: { course: courseId } }),
			api.core.course.get.queryKey({ input: { id: courseId } }),
		]);
	};

	const create = useMutation(
		api.core.video.create.mutationOptions({
			onSuccess: () => {
				invalidate();
				toast.success({ title: "Video created" });
			},
			onError: (err) => {
				toast.error({ title: err.message || "Failed to create video" });
			},
		}),
	);
	const update = useMutation(
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

	const isPending = create.isPending || update.isPending;

	const form = useForm({
		defaultValues: {
			name: video?.name,
			description: video?.description ?? undefined,
			module: video?.module ?? moduleId,
		} as z.infer<typeof videoFormSchema>,
		validators: {
			onSubmit: videoFormSchema as GetFormZod<typeof videoFormSchema>,
		},
		onSubmit: async ({ value }) => {
			if (!value.module) return;

			const payload = {
				name: value.name.trim(),
				description: value.description?.trim() || null,
			};

			if (video) {
				await update.mutateAsync({ id: video.id, ...payload });
				return;
			}
			await create.mutateAsync({
				course: courseId,
				module: value.module,
				...payload,
			});
		},
	});

	return (
		<Drawer>
			<DrawerTrigger asChild>{children}</DrawerTrigger>
			<DrawerContent>
				<DrawerHeader>
					<DrawerTitle>{video ? "Edit Video" : "Create Video"}</DrawerTitle>
					<DrawerDescription>Add video metadata only.</DrawerDescription>
				</DrawerHeader>
				<DrawerInner>
					<form
						id={`video-form-${video?.id ?? "new"}`}
						onSubmit={(event) => {
							event.preventDefault();
							event.stopPropagation();
							form.handleSubmit();
						}}
					>
						<FieldGroup>
							{!video && (
								<form.Field
									name="module"
									children={(field) => (
										<ModuleSelector
											courseId={courseId}
											id={field.name}
											value={field.state.value}
											onValueChange={(val) => field.handleChange(val)}
											disabled={isPending}
										/>
									)}
								/>
							)}

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
					<Button
						type="submit"
						form={`video-form-${video?.id ?? "new"}`}
						disabled={isPending}
					>
						{isPending ? <Spinner /> : video ? <SaveIcon /> : <PlusIcon />}
						{video ? "Save Changes" : "Create Video"}
					</Button>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
}
