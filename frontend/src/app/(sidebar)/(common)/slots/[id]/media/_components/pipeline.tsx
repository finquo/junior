"use client";

import { type UseMutationOptions, useMutation } from "@tanstack/react-query";
import {
	CircleAlertIcon,
	DownloadIcon,
	FileAudioIcon,
	RefreshCwIcon,
	VideoIcon,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api, refetchAPIs } from "@/hooks/api";
import { MutationButton } from "@/hooks/button";
import { RenderWhenRole } from "@/hooks/role";
import type { API_Returns } from "@/lib/api";

type SlotData = NonNullable<API_Returns["core"]["slot"]["get"]>;
type MediaData = API_Returns["media"]["meta"];
type ChunkData = MediaData["chunks"][number];

type ActionKey =
	| "toAudio"
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
		<RenderWhenRole role={["admin", "scheduler"]}>
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
		</RenderWhenRole>
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
	index,
	videoIndexes,
	onIndexChange,
}: {
	slot: SlotData;
	media: MediaData;
	index: number;
	videoIndexes: number[];
	onIndexChange: (index: number) => void;
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
		refetchAPIs([api.media.meta.queryKey({ input: { id, index } })]);
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
							refetchAPIs([api.media.meta.queryKey({ input: { id, index } })])
						}
					>
						<RefreshCwIcon />
						Refresh
					</Button>
				</CardAction>
			</CardHeader>

			<CardContent className="space-y-4">
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
						<CardTitle>Recordings</CardTitle>
						<CardDescription>Videos saved from Zoom.</CardDescription>
					</CardHeader>
					<CardContent>
						<ItemGroup>
							{videoIndexes.map((n) => (
								<Item key={n} variant="outline">
									<ItemMedia variant="icon">
										<VideoIcon />
									</ItemMedia>
									<ItemContent>
										<ItemTitle>Recording {n}</ItemTitle>
										<ItemDescription>{`videos/${n}.mp4`}</ItemDescription>
									</ItemContent>
									<ItemActions>
										<DownloadButton
											id={id}
											path={`videos/${n}.mp4`}
											label="Video"
										/>
									</ItemActions>
								</Item>
							))}
						</ItemGroup>
					</CardContent>
				</Card>

				<Tabs
					value={String(index)}
					onValueChange={(value) => onIndexChange(Number(value))}
				>
					<TabsList>
						{(videoIndexes.length > 0 ? videoIndexes : [0]).map((n) => (
							<TabsTrigger key={n} value={String(n)}>
								Recording {n}
							</TabsTrigger>
						))}
					</TabsList>
					<TabsContent value={String(index)}>
						<Card size="sm">
							<CardHeader>
								<CardTitle>Pipeline</CardTitle>
								<CardDescription>
									Audio conversion, chunks, transcripts, and summary.
								</CardDescription>
							</CardHeader>
							<CardContent>
								<Timeline
									value={getActiveStep([
										!!media.audio,
										media.chunks.length > 0,
										chunksTranscribed,
										!!media.chunkSummary,
									])}
								>
									<PipelineStep
										step={1}
										title={
											media.audio ? "Converted to Audio" : "Converting to Audio"
										}
										description={
											media.audio
												? `audios/${index}.mp3 extracted from the recording.`
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
													input={{ id, index }}
													disabled={!media.video}
													onSuccess={handleSuccess(
														"toAudio",
														"Audio conversion job started",
													)}
												/>
											</>
										}
									/>

									<PipelineStep
										step={2}
										title={
											media.chunks.length > 0
												? "Audio Split Into Chunks"
												: "Split Audio Into Chunks"
										}
										description={
											media.chunks.length > 0
												? `${media.chunks.length} chunks created.`
												: "Audio not split yet."
										}
										error={errors.splitAudio}
										actions={
											<RetryAction
												api={api.media.jobs.splitAudio.mutationOptions({
													onError: handleError("splitAudio"),
												})}
												input={{ id, index }}
												disabled={!media.audio}
												onSuccess={handleSuccess(
													"splitAudio",
													"Audio split job started",
												)}
											/>
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
										step={3}
										title={
											chunksTranscribed
												? "Chunks Transcribed"
												: "Transcribe Chunks"
										}
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
												input={{ id, index }}
												disabled={media.chunks.length === 0}
												onSuccess={handleSuccess(
													"transcribeChunks",
													"Chunks transcribed",
												)}
											/>
										}
									/>

									<PipelineStep
										step={4}
										title={
											media.chunkSummary ? "Summary Created" : "Create Summary"
										}
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
													input={{ id, index }}
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
					</TabsContent>
				</Tabs>
			</CardContent>
		</Card>
	);
}
