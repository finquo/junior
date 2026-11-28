"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { CircleAlertIcon, PlusIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { sileo as toast } from "sileo";
import type { z } from "zod";
import {
	CourseSelector,
	ModuleSelector,
} from "@/components/custom/course-selector";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { api, refetchAPIs } from "@/hooks/api";
import type { GetFormZod } from "@/lib/utils";
import { videoCreateFormSchema } from "../../_components/video-schema";
import {
	uploadVideo,
	VIDEO_CONTENT_TYPE,
	VideoFileUpload,
} from "./video-file-upload";

export function VideoCreateForm() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const initialCourseId = searchParams.get("course") ?? undefined;
	const initialModuleId = searchParams.get("module") ?? undefined;

	const [courseId, setCourseId] = useState(initialCourseId);
	const [file, setFile] = useState<File | null>(null);
	const [progress, setProgress] = useState(0);
	const [isUploading, setIsUploading] = useState(false);
	const [uploadError, setUploadError] = useState<string | null>(null);

	const create = useMutation(api.core.video.create.mutationOptions({}));
	const uploadUrl = useMutation(api.stream.uploadUrl.mutationOptions({}));
	const remove = useMutation(api.core.video.delete.mutationOptions({}));

	const invalidate = (course: string) => {
		refetchAPIs([
			api.core.video.list.queryKey({ input: { course } }),
			api.core.module.list.queryKey({ input: { course } }),
			api.core.course.get.queryKey({ input: { id: course } }),
			api.core.module.listAll.queryKey(),
			api.sidebar.modules.queryKey(),
			api.stream.list.queryKey(),
		]);
	};

	const isPending =
		create.isPending || uploadUrl.isPending || remove.isPending || isUploading;

	const form = useForm({
		defaultValues: {
			course: initialCourseId,
			module: initialModuleId,
			name: undefined,
			description: undefined,
		} as z.infer<typeof videoCreateFormSchema>,
		validators: {
			onSubmit: videoCreateFormSchema as GetFormZod<
				typeof videoCreateFormSchema
			>,
		},
		onSubmit: async ({ value }) => {
			if (!value.course || !value.module || !value.name) return;
			if (!file) {
				setUploadError("Choose an MP4 video file before creating the video.");
				return;
			}

			setUploadError(null);
			setProgress(0);
			setIsUploading(true);
			let createdId: string | undefined;

			try {
				const created = await create.mutateAsync({
					course: value.course,
					module: value.module,
					name: value.name.trim(),
					description: value.description?.trim() || null,
				});
				const id = created?.id;
				if (!id) throw new Error("Video was created without an id");
				createdId = id;

				const { url } = await uploadUrl.mutateAsync({
					videoId: id,
					contentType: VIDEO_CONTENT_TYPE,
				});
				if (!url) throw new Error("Upload URL was not returned");
				await uploadVideo(url, file, setProgress);

				refetchAPIs([
					api.core.video.list.queryKey({ input: { course: value.course } }),
					api.core.module.list.queryKey({ input: { course: value.course } }),
					api.core.course.get.queryKey({ input: { id: value.course } }),
					api.core.module.listAll.queryKey(),
					api.sidebar.modules.queryKey(),
					api.stream.list.queryKey(),
					api.stream.files.queryKey({ input: { videoId: id } }),
				]);
				toast.success({ title: "Video uploaded" });
				router.push(`/videos/${id}` as "/");
			} catch (error) {
				if (createdId) {
					try {
						await remove.mutateAsync({ id: createdId });
						invalidate(value.course);
					} catch {
						// Keep the original upload error visible.
					}
				}

				const message =
					error instanceof Error ? error.message : "Failed to upload video";
				setUploadError(message);
				toast.error({ title: message });
			} finally {
				setIsUploading(false);
			}
		},
	});

	const handleFileChange = (nextFile: File | null) => {
		setFile(nextFile);
		setProgress(0);
		setUploadError(null);
	};

	return (
		<form
			id="video-create-form"
			onSubmit={(event) => {
				event.preventDefault();
				event.stopPropagation();
				form.handleSubmit();
			}}
		>
			<FieldGroup>
				<form.Field
					name="course"
					children={(field) => (
						<CourseSelector
							id={field.name}
							value={field.state.value}
							disabled={isPending}
							onValueChange={(val) => {
								field.handleChange(val);
								form.setFieldValue("module", undefined);
								setCourseId(val);
							}}
						/>
					)}
				/>

				<form.Field
					name="module"
					children={(field) =>
						courseId ? (
							<ModuleSelector
								courseId={courseId}
								id={field.name}
								value={field.state.value}
								disabled={isPending}
								onValueChange={field.handleChange}
							/>
						) : (
							<Field>
								<FieldLabel>Module</FieldLabel>
								<FieldDescription>Select a course first.</FieldDescription>
							</Field>
						)
					}
				/>

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
									onChange={(event) => field.handleChange(event.target.value)}
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
							<FieldDescription>Optional</FieldDescription>
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
						</Field>
					)}
				/>

				<VideoFileUpload
					file={file}
					onFileChange={handleFileChange}
					disabled={isPending}
					progress={progress}
					isUploading={isUploading}
				/>

				{uploadError && (
					<Field>
						<Alert variant="destructive">
							<CircleAlertIcon />
							<AlertTitle>Upload failed</AlertTitle>
							<AlertDescription>
								<p>{uploadError}</p>
							</AlertDescription>
						</Alert>
					</Field>
				)}
				<form.Subscribe
					selector={(state) => [state.canSubmit, state.isDirty]}
					children={([canSubmit, isDirty]) => (
						<Field orientation={"horizontal"}>
							<Button
								type="button"
								variant="outline"
								disabled={!isDirty || isPending}
								onClick={() => {
									form.reset();
									handleFileChange(null);
								}}
							>
								Reset
							</Button>
							<Button
								type="submit"
								form="video-create-form"
								disabled={!canSubmit || isPending || !file}
							>
								{isPending ? <Spinner /> : <PlusIcon />}
								Create Video
							</Button>
						</Field>
					)}
				/>
			</FieldGroup>
		</form>
	);
}
