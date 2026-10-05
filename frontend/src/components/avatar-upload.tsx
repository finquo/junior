"use client";

import { cn } from "cn";
import { CircleAlertIcon, UserIcon, XIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { formatBytes, useFileUpload } from "@/hooks/use-file-upload";

export interface AvatarUploadProps {
	maxSize?: number;
	className?: string;
	onFileChange?: (url: string | null) => void;
	defaultAvatar?: string;
}

export function AvatarUpload({
	maxSize = 2 * 1024 * 1024,
	className,
	onFileChange,
	defaultAvatar,
}: AvatarUploadProps) {
	const [isDefaultRemoved, setIsDefaultRemoved] = useState(false);

	const [
		{ files, isDragging, errors },
		{
			removeFile,
			handleDragEnter,
			handleDragLeave,
			handleDragOver,
			handleDrop,
			openFileDialog,
			getInputProps,
		},
	] = useFileUpload({
		maxFiles: 1,
		maxSize,
		accept: "image/*",
		multiple: false,
	});

	const currentFile = files[0];
	const previewUrl =
		currentFile?.preview || (!isDefaultRemoved ? defaultAvatar : null);

	const onFileChangeRef = useRef(onFileChange);
	onFileChangeRef.current = onFileChange;

	const isInitialMount = useRef(true);

	// Reset removal state if defaultAvatar changes
	useEffect(() => {
		setIsDefaultRemoved(false);
	}, [defaultAvatar]);

	// Safely notify parent with URL or null
	useEffect(() => {
		if (isInitialMount.current) {
			isInitialMount.current = false;
			return;
		}

		if (currentFile?.preview) {
			setIsDefaultRemoved(false);
			onFileChangeRef.current?.(currentFile.preview);
		} else if (isDefaultRemoved) {
			onFileChangeRef.current?.(null);
		}
	}, [currentFile, isDefaultRemoved]);

	const handleRemove = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (currentFile) {
			removeFile(currentFile.id);
		}
		setIsDefaultRemoved(true);
		onFileChangeRef.current?.(null);
	};

	return (
		<div className={cn("flex flex-col items-center gap-4", className)}>
			<div className="relative">
				<div
					className={cn(
						"group/avatar relative h-24 w-24 cursor-pointer overflow-hidden rounded-sm border border-dashed transition-colors",
						isDragging
							? "border-primary bg-primary/5"
							: "border-muted-foreground/25 hover:border-muted-foreground/20",
						previewUrl && "border-solid",
					)}
					onDragEnter={handleDragEnter}
					onDragLeave={handleDragLeave}
					onDragOver={handleDragOver}
					onDrop={handleDrop}
					onClick={openFileDialog}
				>
					<input {...getInputProps()} className="sr-only" />

					{previewUrl ? (
						<img
							src={previewUrl}
							alt="Avatar"
							className="h-full w-full object-cover"
						/>
					) : (
						<div className="flex h-full w-full items-center justify-center">
							<UserIcon className="size-6 text-muted-foreground" />
						</div>
					)}
				</div>

				{previewUrl && (
					<Button
						type="button"
						size="icon-xs"
						variant="destructive"
						onClick={handleRemove}
						className="absolute -top-2 -right-2 z-10"
						aria-label="Remove avatar"
					>
						<XIcon />
					</Button>
				)}
			</div>

			<div className="space-y-0.5 text-center">
				<p className="font-medium text-sm">
					{currentFile
						? "Avatar uploaded"
						: previewUrl
							? "Current avatar"
							: "Upload avatar"}
				</p>
				<p className="text-muted-foreground text-xs">
					PNG, JPG up to {formatBytes(maxSize)}
				</p>
			</div>

			{errors.length > 0 && (
				<Alert variant="destructive" className="mt-5">
					<CircleAlertIcon />
					<AlertTitle>File upload error(s)</AlertTitle>
					<AlertDescription>
						{errors.map((error, index) => (
							<p key={index as number} className="last:mb-0">
								{error}
							</p>
						))}
					</AlertDescription>
				</Alert>
			)}
		</div>
	);
}
