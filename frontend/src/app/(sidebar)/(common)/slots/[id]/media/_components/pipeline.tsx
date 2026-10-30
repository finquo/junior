"use client";

import { type UseMutationOptions, useMutation } from "@tanstack/react-query";
import {
	CircleAlertIcon,
	DownloadIcon,
	FileAudioIcon,
	FileTextIcon,
	GitForkIcon,
	RefreshCwIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { sileo as toast } from "sileo";
import {
	Timeline,
	TimelineAction,
	TimelineContent,
	TimelineHeader,
	TimelineIndicator,
	TimelineItem,
	TimelineSeparator,
	TimelineTitle,
} from "@/components/reui/timeline";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemGroup,
	ItemMedia,
	ItemTitle,
} from "@/components/ui/item";
import { Spinner } from "@/components/ui/spinner";
import { api, refetchAPIs } from "@/hooks/api";
import { MutationButton } from "@/hooks/button";
import type { API_Returns } from "@/lib/api";

type SlotData = NonNullable<API_Returns["core"]["slot"]["get"]>;
type MediaData = API_Returns["media"]["meta"];
type ChunkData = MediaData["chunks"][number];

type ActionKey =
	| "toAudio"
	| "transcribeAudio"
	| "summarize"
	| "splitAudio"
	| "transcribeChunks"
	| "summarizeChunks";

function getActiveStep(completed: boolean[]) {
	let step = 0;

	for (const done of completed) {
		if (!done) return step;
		step++;
	}

	return step;
}

function formatDateTime(value: Date | string | null | undefined) {
	if (!value) return "—";
	return new Date(value).toLocaleString([], {
		dateStyle: "medium",
		timeStyle: "short",
	});
}

function triggerFileDownload(url: string, name: string) {
	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = name;
	document.body.appendChild(anchor);
	anchor.click();
	anchor.remove();
}

function DownloadButton({
	id,
	path,
	label,
}: {
	id: string;
	path: string;
	label: string;
}) {
	const { mutate, isPending } = useMutation(
		api.media.download.mutationOptions({
			onSuccess: (data) => {
				if (data.url) triggerFileDownload(data.url, data.name);
			},
		}),
	);

	return (
		<Button
			variant="outline"
			size="sm"
			disabled={isPending}
			onClick={() => mutate({ id, path })}
		>
			{isPending ? <Spinner /> : <DownloadIcon />}
			{label}
		</Button>
	);
}

function RetryAction<TData, TError, TVariables>({
	api: mutationApi,
	input,
	disabled,
	onSuccess,
}: {
	api: UseMutationOptions<TData, TError, TVariables>;
	input: TVariables;
	disabled?: boolean;
	onSuccess: () => void;
}) {
	return (
		<MutationButton
			api={mutationApi}
			onSuccess={onSuccess}
			isPending={
				<Button variant="outline" size="sm" disabled>
					<Spinner />
					Retry
				</Button>
			}
			mutate={(mutate) => (
				<Button
					variant="outline"
					size="sm"
					disabled={disabled}
					onClick={() => mutate(input)}
				>
					<RefreshCwIcon />
					Retry
				</Button>
			)}
		/>
	);
}

function PipelineStep({
	step,
	title,
	description,
	error,
	actions,
	children,
}: {
	step: number;
	title: string;
	description: string;
	error?: string;
	actions?: ReactNode;
	children?: ReactNode;
}) {
	return (
		<TimelineItem step={step}>
			<TimelineIndicator />
			<TimelineSeparator />
			<TimelineHeader>
				<TimelineTitle>{title}</TimelineTitle>
				{actions && (
					<TimelineAction>
						<ButtonGroup>{actions}</ButtonGroup>
					</TimelineAction>
				)}
			</TimelineHeader>
			<TimelineContent>{description}</TimelineContent>
			{children}
			{error && (
				<Alert variant="destructive">
					<CircleAlertIcon />
					<AlertTitle>Step failed</AlertTitle>
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}
		</TimelineItem>
	);
}

function ChunkItem({ id, chunk }: { id: string; chunk: ChunkData }) {
	return (
		<Item variant="outline">
			<ItemMedia variant="icon">
				<FileAudioIcon />
			</ItemMedia>
			<ItemContent>
				<ItemTitle>{chunk.path.split("/").pop() ?? chunk.path}</ItemTitle>
				<ItemDescription>
					{chunk.transcript ? "Transcript ready" : "Transcript pending"}
				</ItemDescription>
			</ItemContent>
			<ItemActions>
				<DownloadButton id={id} path={chunk.path} label="Audio" />
				{chunk.transcript ? (
					<DownloadButton
						id={id}
						path={chunk.transcript.path}
						label="Transcript"
					/>
				) : (
					<Badge variant="outline">Pending</Badge>
				)}
			</ItemActions>
		</Item>
	);
}

export function MediaPipeline({
	slot,
	media,
}: {
	slot: SlotData;
	media: MediaData;
}) {
	const [errors, setErrors] = useState<Partial<Record<ActionKey, string>>>({});
	const id = slot.id;

	const attended = slot.status === "attended";
	const transcribedChunks = media.chunks.filter((chunk) => chunk.transcript);
	const chunksTranscribed =
		media.chunks.length > 0 && transcribedChunks.length === media.chunks.length;

	const handleSuccess = (action: ActionKey, title: string) => () => {
		setErrors((previous) => {
			const next = { ...previous };
			delete next[action];
			return next;
		});
		refetchAPIs([api.media.meta.queryKey({ input: { id } })]);
		toast.success({ title });
	};

	const handleError = (action: ActionKey) => (error: Error) => {
		setErrors((previous) => ({ ...previous, [action]: error.message }));
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Media Pipeline</CardTitle>
				<CardDescription>Recording and processing jobs.</CardDescription>
				<CardAction>
					<Button
						variant="outline"
						size="sm"
						onClick={() =>
							refetchAPIs([api.media.meta.queryKey({ input: { id } })])
						}
					>
						<RefreshCwIcon />
						Refresh
					</Button>
				</CardAction>
			</CardHeader>

			<CardContent>
				{!attended && (
					<Alert>
						<CircleAlertIcon />
						<AlertTitle>Session not attended</AlertTitle>
						<AlertDescription>
							The pipeline starts once the session is marked as attended.
						</AlertDescription>
					</Alert>
				)}

				<Card size="sm">
					<CardHeader>
						<CardTitle>Recording</CardTitle>
						<CardDescription>From recording to audio.</CardDescription>
					</CardHeader>
					<CardContent>
						<Timeline
							defaultValue={getActiveStep([
								attended,
								!!media.video,
								!!media.audio,
							])}
						>
							<PipelineStep
								step={1}
								title="Session Attended"
								description={
									attended
										? `Completed on ${formatDateTime(slot.endTime)}.`
										: "Not marked as attended yet."
								}
							/>

							<PipelineStep
								step={2}
								title="Recording Saved"
								description={
									media.video
										? "video.mp4 is in the media bucket."
										: "No recording uploaded yet."
								}
								actions={
									media.video ? (
										<DownloadButton
											id={id}
											path={media.video.path}
											label="Video"
										/>
									) : undefined
								}
							/>

							<PipelineStep
								step={3}
								title="Converted to Audio"
								description={
									media.audio
										? "audio.mp3 extracted from the recording."
										: "Waiting for the conversion job."
								}
								error={errors.toAudio}
								actions={
									<>
										{media.audio && (
											<DownloadButton
												id={id}
												path={media.audio.path}
												label="Audio"
											/>
										)}
										<RetryAction
											api={api.media.jobs.toAudio.mutationOptions({
												onError: handleError("toAudio"),
											})}
											input={{ id }}
											disabled={!media.video}
											onSuccess={handleSuccess(
												"toAudio",
												"Audio conversion job started",
											)}
										/>
									</>
								}
							/>
						</Timeline>
					</CardContent>
				</Card>

				<Item variant="muted">
					<ItemMedia variant="icon">
						<GitForkIcon />
					</ItemMedia>
					<ItemContent>
						<ItemTitle>From Here, there are two ways</ItemTitle>
						<ItemDescription>
							Summarize the full transcript, or summarize the audio chunks.
						</ItemDescription>
					</ItemContent>
				</Item>

				<div className="grid gap-4 md:grid-cols-2">
					<Card size="sm">
						<CardHeader>
							<CardTitle>Direct</CardTitle>
							<CardDescription>From the full transcript.</CardDescription>
						</CardHeader>
						<CardContent>
							<Timeline
								defaultValue={getActiveStep([
									!!media.transcript,
									!!media.summary,
									!!media.summary,
								])}
							>
								<PipelineStep
									step={1}
									title="Audio Transcribed"
									description={
										media.transcript
											? "transcript/main.json is ready."
											: "The full audio is not transcribed yet."
									}
									error={errors.transcribeAudio}
									actions={
										<>
											{media.transcript && (
												<DownloadButton
													id={id}
													path={media.transcript.path}
													label="Transcript"
												/>
											)}
											<RetryAction
												api={api.media.transcribeAudio.mutationOptions({
													onError: handleError("transcribeAudio"),
												})}
												input={{ id }}
												disabled={!media.audio}
												onSuccess={handleSuccess(
													"transcribeAudio",
													"Audio transcribed",
												)}
											/>
										</>
									}
								/>

								<PipelineStep
									step={2}
									title="Summary Created"
									description={
										media.summary
											? "summary/main.json is ready."
											: "No summary from the full transcript."
									}
									error={errors.summarize}
									actions={
										<>
											{media.summary && (
												<DownloadButton
													id={id}
													path={media.summary.path}
													label="Summary"
												/>
											)}
											<RetryAction
												api={api.media.summarize.mutationOptions({
													onError: handleError("summarize"),
												})}
												input={{ id }}
												disabled={!media.transcript}
												onSuccess={handleSuccess(
													"summarize",
													"Transcript summarized",
												)}
											/>
										</>
									}
								/>

								<PipelineStep
									step={3}
									title="Summary PDF"
									description={
										media.summary
											? "Render the summary as a shareable PDF."
											: "The PDF export becomes available once the summary is ready."
									}
									actions={
										media.summary ? (
											<Button asChild variant="outline" size="sm">
												<a
													href={`/slots/${id}/media/pdf`}
													target="_blank"
													rel="noreferrer"
												>
													<FileTextIcon />
													Open PDF
												</a>
											</Button>
										) : undefined
									}
								/>
							</Timeline>
						</CardContent>
					</Card>

					<Card size="sm">
						<CardHeader>
							<CardTitle>Splitted</CardTitle>
							<CardDescription>From audio chunks.</CardDescription>
						</CardHeader>
						<CardContent>
							<Timeline
								defaultValue={getActiveStep([
									media.chunks.length > 0,
									chunksTranscribed,
									!!media.chunkSummary,
								])}
							>
								<PipelineStep
									step={1}
									title="Audio Split Into Chunks"
									description={
										media.chunks.length > 0
											? `${media.chunks.length} chunks created.`
											: "Audio not split yet."
									}
									error={errors.splitAudio}
									actions={
										<>
											{media.audio && (
												<DownloadButton
													id={id}
													path={media.audio.path}
													label="Audio"
												/>
											)}
											<RetryAction
												api={api.media.jobs.splitAudio.mutationOptions({
													onError: handleError("splitAudio"),
												})}
												input={{ id }}
												disabled={!media.audio}
												onSuccess={handleSuccess(
													"splitAudio",
													"Audio split job started",
												)}
											/>
										</>
									}
								>
									{media.chunks.length > 0 && (
										<ItemGroup>
											{media.chunks.map((chunk) => (
												<ChunkItem key={chunk.path} id={id} chunk={chunk} />
											))}
										</ItemGroup>
									)}
								</PipelineStep>

								<PipelineStep
									step={2}
									title="Chunks Transcribed"
									description={
										media.chunks.length > 0
											? `${transcribedChunks.length} of ${media.chunks.length} transcribed.`
											: "Waiting for the chunks."
									}
									error={errors.transcribeChunks}
									actions={
										<RetryAction
											api={api.media.transcribeAudioChunks.mutationOptions({
												onError: handleError("transcribeChunks"),
											})}
											input={{ id }}
											disabled={media.chunks.length === 0}
											onSuccess={handleSuccess(
												"transcribeChunks",
												"Chunks transcribed",
											)}
										/>
									}
								/>

								<PipelineStep
									step={3}
									title="Summary Created"
									description={
										media.chunkSummary
											? "summary/chunks.json is ready."
											: "No summary from the chunk transcriptions."
									}
									error={errors.summarizeChunks}
									actions={
										<>
											{media.chunkSummary && (
												<DownloadButton
													id={id}
													path={media.chunkSummary.path}
													label="Summary"
												/>
											)}
											<RetryAction
												api={api.media.summarizeChunks.mutationOptions({
													onError: handleError("summarizeChunks"),
												})}
												input={{ id }}
												disabled={!chunksTranscribed}
												onSuccess={handleSuccess(
													"summarizeChunks",
													"Chunked transcript summarized",
												)}
											/>
										</>
									}
								/>
							</Timeline>
						</CardContent>
					</Card>
				</div>
			</CardContent>
		</Card>
	);
}
