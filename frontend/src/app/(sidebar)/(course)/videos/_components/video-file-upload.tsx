"use client";

import {
	CircleAlertIcon,
	CloudUploadIcon,
	VideoIcon,
	XIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
	Attachment,
	AttachmentAction,
	AttachmentActions,
	AttachmentContent,
	AttachmentDescription,
	AttachmentMedia,
	AttachmentTitle,
} from "@/components/ui/attachment";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { formatBytes, useFileUpload } from "@/hooks/use-file-upload";

export const VIDEO_CONTENT_TYPE = "video/mp4";
const VIDEO_ACCEPT = "video/mp4,.mp4";

export function uploadVideo(
	url: string,
	file: File,
	onProgress: (progress: number) => void,
) {
	return new Promise<void>((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		xhr.open("PUT", url);
		xhr.setRequestHeader("Content-Type", VIDEO_CONTENT_TYPE);

		xhr.upload.onprogress = (event) => {
			if (event.lengthComputable) {
				onProgress(Math.round((event.loaded / event.total) * 100));
			}
		};
		xhr.onload = () => {
			if (xhr.status >= 200 && xhr.status < 300) {
				resolve();
				return;
			}
			reject(new Error(`Upload failed with status ${xhr.status}`));
		};
		xhr.onerror = () => reject(new Error("Upload failed. Please try again."));
		xhr.send(file);
	});
}

function getVideoThumbnail(file: File) {
	return new Promise<string | null>((resolve) => {
		const objectUrl = URL.createObjectURL(file);
		const video = document.createElement("video");
		let settled = false;
		let hasSeekTarget = false;
		const timeout = window.setTimeout(() => finish(null), 5000);

		function finish(thumbnail: string | null) {
			if (settled) return;
			settled = true;
			window.clearTimeout(timeout);
			URL.revokeObjectURL(objectUrl);
			resolve(thumbnail);
		}

		function draw() {
			if (!video.videoWidth || !video.videoHeight) return;
			const canvas = document.createElement("canvas");
			canvas.width = 480;
			canvas.height = Math.round(
				(video.videoHeight / video.videoWidth) * canvas.width,
			);
			const context = canvas.getContext("2d");
			if (!context) {
				finish(null);
				return;
			}
			context.drawImage(video, 0, 0, canvas.width, canvas.height);
			finish(canvas.toDataURL("image/jpeg", 0.8));
		}

		video.preload = "auto";
		video.muted = true;
		video.playsInline = true;
		video.onloadedmetadata = () => {
			const duration = Number.isFinite(video.duration) ? video.duration : 0;
			const target = duration > 1 ? Math.min(1, duration / 10) : 0;
			hasSeekTarget = target > 0;
			if (hasSeekTarget) video.currentTime = target;
		};
		video.onloadeddata = () => {
			if (!hasSeekTarget) draw();
		};
		video.onseeked = draw;
		video.onerror = () => finish(null);
		video.src = objectUrl;
	});
}

export function VideoFileUpload({
	file,
	onFileChange,
	disabled,
	progress,
	isUploading,
}: {
	file: File | null;
	onFileChange: (file: File | null) => void;
	disabled: boolean;
	progress: number;
	isUploading: boolean;
}) {
	const [
		{ isDragging, errors },
		{
			handleDragEnter,
			handleDragLeave,
			handleDragOver,
			handleDrop,
			openFileDialog,
			getInputProps,
		},
	] = useFileUpload({
		maxFiles: 1,
		accept: VIDEO_ACCEPT,
		multiple: false,
		onFilesChange: (files) => {
			const nextFile = files[0]?.file;
			onFileChange(nextFile instanceof File ? nextFile : null);
		},
	});
	const [thumbnail, setThumbnail] = useState<string | null>(null);
	const [isThumbnailLoading, setIsThumbnailLoading] = useState(false);

	useEffect(() => {
		let cancelled = false;
		setThumbnail(null);
		setIsThumbnailLoading(false);
		if (!file) return;

		setIsThumbnailLoading(true);
		void getVideoThumbnail(file).then((nextThumbnail) => {
			if (cancelled) return;
			setThumbnail(nextThumbnail);
			setIsThumbnailLoading(false);
		});

		return () => {
			cancelled = true;
		};
	}, [file]);

	let uploadedFile: React.ReactNode = null;
	if (file) {
		const attachmentState: React.ComponentProps<typeof Attachment>["state"] =
			isUploading ? "uploading" : "done";
		const attachmentDescription = isUploading
			? `${formatBytes(file.size)} · Uploading ${Math.round(progress)}%`
			: formatBytes(file.size);
		const thumbnailContent = thumbnail ? (
			<img src={thumbnail} alt={file.name} />
		) : isThumbnailLoading ? (
			<Spinner />
		) : (
			<VideoIcon />
		);

		uploadedFile = (
			<Attachment
				className="w-fit"
				size="lg"
				orientation="thumbnail"
				state={attachmentState}
			>
				<AttachmentMedia variant="thumbnail">
					{thumbnailContent}
				</AttachmentMedia>
				<AttachmentContent>
					<AttachmentTitle>{file.name}</AttachmentTitle>
					<AttachmentDescription>{attachmentDescription}</AttachmentDescription>
					{isUploading && <Progress value={progress} />}
				</AttachmentContent>
				<AttachmentActions>
					<AttachmentAction
						type="button"
						variant="destructive"
						aria-label={`Remove ${file.name}`}
						disabled={disabled}
						onClick={(event) => {
							event.stopPropagation();
							onFileChange(null);
						}}
					>
						<XIcon />
					</AttachmentAction>
				</AttachmentActions>
			</Attachment>
		);
	}

	return (
		<Field data-invalid={errors.length > 0}>
			<FieldLabel htmlFor="video-file">Video File</FieldLabel>
			<FieldDescription>
				An MP4 source file is required. The video row is created and the file is
				uploaded when you submit.
			</FieldDescription>
			<div
				role="button"
				tabIndex={file || disabled ? -1 : 0}
				aria-label="Upload video file"
				aria-disabled={disabled}
				className="rounded-xl border-3 border-dashed p-8 transition-colors"
				data-dragging={isDragging}
				onClick={() => {
					if (!file && !disabled) openFileDialog();
				}}
				onKeyDown={(event) => {
					if (file || disabled) return;
					if (event.key === "Enter" || event.key === " ") {
						event.preventDefault();
						openFileDialog();
					}
				}}
				onDragEnter={handleDragEnter}
				onDragLeave={handleDragLeave}
				onDragOver={handleDragOver}
				onDrop={handleDrop}
			>
				<input
					{...getInputProps({ id: "video-file", disabled })}
					className="sr-only"
				/>
				{uploadedFile || (
					<Empty>
						<CloudUploadIcon className="text-primary" />
						<EmptyTitle>Upload MP4 video</EmptyTitle>
						<EmptyDescription>
							Drag and drop an MP4 file here, or press Enter to browse.
						</EmptyDescription>
					</Empty>
				)}
			</div>
			{errors.length > 0 && (
				<Alert variant="destructive">
					<CircleAlertIcon />
					<AlertTitle>File upload error(s)</AlertTitle>
					<AlertDescription>
						{errors.map((error, index) => (
							<p key={index as number}>{error}</p>
						))}
					</AlertDescription>
				</Alert>
			)}
		</Field>
	);
}
