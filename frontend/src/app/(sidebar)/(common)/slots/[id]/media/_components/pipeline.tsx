"use client";

import {
	type UseMutationOptions,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import {
	CircleAlertIcon,
	DownloadIcon,
	EyeIcon,
	FileAudioIcon,
	FileJsonIcon,
	FileTextIcon,
	FolderIcon,
	PlayIcon,
	RefreshCwIcon,
	SendIcon,
	TrashIcon,
	VideoIcon,
} from "lucide-react";
import Link from "next/link";
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
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogMedia,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import { ScrollArea } from "@/components/ui/scroll-area";
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
	| "summarizeChunks"
	| "transcribeAudio"
	| "summarize";

const POLL_MS = 5000;
const TIMEOUT_MS = 30 * 60 * 1000;

function getActiveStep(completed: boolean[]) {
	let step = 0;

	for (const done of completed) {
		if (!done) return step;
		step++;
	}

	return step;
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
				window.open(data.url, "_blank", "noopener,noreferrer");
			},
		}),
	);

	return (
		<ButtonGroup>
			<Button
				variant="outline"
				size="sm"
				disabled={isPending}
				onClick={() => mutate({ id, path, inline: true })}
			>
				<EyeIcon />
				View
			</Button>
			<Button
				variant="outline"
				size="sm"
				disabled={isPending}
				onClick={() => mutate({ id, path })}
			>
				{isPending ? <Spinner /> : <DownloadIcon />}
				{label}
			</Button>
		</ButtonGroup>
	);
}

function DeleteButton({
	id,
	path,
	label,
	index,
}: {
	id: string;
	path: string;
	label: string;
	index: number;
}) {
	const { mutate, isPending } = useMutation(
		api.media.delete.mutationOptions({
			onSuccess: () => {
				refetchAPIs([
					api.media.meta.queryKey({ input: { id, index } }),
					api.media.library.files.queryKey({ input: { id } }),
				]);
				toast.success({ title: `${label} deleted` });
			},
		}),
	);

	return (
		<RenderWhenRole role={["admin", "scheduler"]}>
			<AlertDialog>
				<AlertDialogTrigger asChild>
					<Button variant="destructive" size="sm" disabled={isPending}>
						{isPending ? <Spinner /> : <TrashIcon />}
						Delete
					</Button>
				</AlertDialogTrigger>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogMedia>
							<TrashIcon />
						</AlertDialogMedia>
						<AlertDialogTitle>Delete {label}?</AlertDialogTitle>
						<AlertDialogDescription>
							{path} will be removed from the bucket. This cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							variant="destructive"
							onClick={() => mutate({ id, path })}
						>
							<TrashIcon />
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</RenderWhenRole>
	);
}

function DeleteChunksButton({
	id,
	index,
	target,
	label,
}: {
	id: string;
	index: number;
	target: "audio" | "transcripts";
	label: string;
}) {
	const { mutate, isPending } = useMutation(
		api.media.deleteChunks.mutationOptions({
			onSuccess: ({ deleted }) => {
				refetchAPIs([api.media.meta.queryKey({ input: { id, index } })]);
				toast.success({ title: `Deleted ${deleted} chunk files` });
			},
		}),
	);

	return (
		<RenderWhenRole role={["admin", "scheduler"]}>
			<AlertDialog>
				<AlertDialogTrigger asChild>
					<Button variant="destructive" size="sm" disabled={isPending}>
						{isPending ? <Spinner /> : <TrashIcon />}
						{label}
					</Button>
				</AlertDialogTrigger>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogMedia>
							<TrashIcon />
						</AlertDialogMedia>
						<AlertDialogTitle>{label}?</AlertDialogTitle>
						<AlertDialogDescription>
							All files in this group for this recording will be removed. This
							cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							variant="destructive"
							onClick={() => mutate({ id, index, target })}
						>
							<TrashIcon />
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</RenderWhenRole>
	);
}

function ShowSummaryButton({ id }: { id: string }) {
	const { mutate, isPending } = useMutation(
		api.media.download.mutationOptions({
			onSuccess: (data) => {
				window.open(data.url, "_blank", "noopener,noreferrer");
			},
		}),
	);

	return (
		<Button
			variant="outline"
			size="sm"
			disabled={isPending}
			onClick={() => mutate({ id, path: "summary/main.json" })}
		>
			{isPending ? <Spinner /> : <FileJsonIcon />}
			Show Summary
		</Button>
	);
}

function SendToParentButton({
	id,
	source,
	disabled,
}: {
	id: string;
	source?: "chunks";
	disabled?: boolean;
}) {
	const { mutate, isPending } = useMutation(
		api.media.sendSummary.mutationOptions({
			onSuccess: () => {
				toast.success({ title: "Summary sent to parent" });
			},
			onError: (error) => {
				toast.error({ title: error.message });
			},
		}),
	);

	return (
		<Button
			variant="outline"
			size="sm"
			disabled={disabled || isPending}
			onClick={() => mutate({ id, source })}
		>
			{isPending ? <Spinner /> : <SendIcon />}
			Send to student
		</Button>
	);
}

function RetryAction<TData, TError, TVariables>({
	api: mutationApi,
	input,
	disabled,
	label,
	onSuccess,
}: {
	api: UseMutationOptions<TData, TError, TVariables>;
	input: TVariables;
	disabled?: boolean;
	label: string;
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
						{label}
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
						{label}
					</Button>
				)}
			/>
		</RenderWhenRole>
	);
}

function RunAllButton({
	id,
	index,
	media,
	disabled,
	onDone,
}: {
	id: string;
	index: number;
	media: MediaData;
	disabled: boolean;
	onDone: () => void;
}) {
	const queryClient = useQueryClient();
	const [step, setStep] = useState<string | null>(null);

	const toAudio = useMutation(api.media.jobs.toAudio.mutationOptions());
	const splitAudio = useMutation(api.media.jobs.splitAudio.mutationOptions());
	const transcribeChunks = useMutation(
		api.media.transcribeAudioChunks.mutationOptions(),
	);
	const summarizeChunks = useMutation(
		api.media.summarizeChunks.mutationOptions(),
	);

	const readMeta = () =>
		queryClient.fetchQuery(
			api.media.meta.queryOptions({
				input: { id, index },
				staleTime: 0,
			}),
		);

	const waitUntil = async (done: (meta: MediaData) => boolean) => {
		const deadline = Date.now() + TIMEOUT_MS;

		while (Date.now() < deadline) {
			if (done(await readMeta())) return;
			await new Promise((resolve) => setTimeout(resolve, POLL_MS));
		}

		throw new Error("Timed out waiting for the job to finish");
	};

	const run = async () => {
		try {
			if (!media.audio) {
				setStep("Converting to audio");
				await toAudio.mutateAsync({ id, index });
				await waitUntil((meta) => !!meta.audio);
			}

			if (media.chunks.length === 0) {
				setStep("Splitting audio");
				await splitAudio.mutateAsync({ id, index });
				await waitUntil((meta) => meta.chunks.length > 0);
			}

			setStep("Transcribing chunks");
			await transcribeChunks.mutateAsync({ id, index });

			setStep("Creating summary");
			await summarizeChunks.mutateAsync({ id, index });

			toast.success({ title: "Pipeline finished" });
		} catch (error) {
			toast.error({
				title: "Pipeline stopped",
				description: error instanceof Error ? error.message : undefined,
			});
		} finally {
			setStep(null);
			onDone();
		}
	};

	return (
		<RenderWhenRole role={["admin", "scheduler"]}>
			<Button size="sm" disabled={disabled || step !== null} onClick={run}>
				{step ? <Spinner /> : <PlayIcon />}
				{step ?? "Run all"}
			</Button>
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

function ChunkItem({
	id,
	index,
	chunk,
}: {
	id: string;
	index: number;
	chunk: ChunkData;
}) {
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
				<DeleteButton id={id} path={chunk.path} label="Chunk" index={index} />
			</ItemActions>
		</Item>
	);
}

function FileScroll({
	count,
	children,
}: {
	count: number;
	children: ReactNode;
}) {
	if (count < 10) return children;

	return <ScrollArea className="h-96">{children}</ScrollArea>;
}

function TranscriptItem({
	id,
	index,
	path,
}: {
	id: string;
	index: number;
	path: string;
}) {
	return (
		<Item variant="outline">
			<ItemMedia variant="icon">
				<FileJsonIcon />
			</ItemMedia>
			<ItemContent>
				<ItemTitle>{path.split("/").pop() ?? path}</ItemTitle>
				<ItemDescription>{path}</ItemDescription>
			</ItemContent>
			<ItemActions>
				<DownloadButton id={id} path={path} label="Transcript" />
				<DeleteButton id={id} path={path} label="Transcript" index={index} />
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
	const transcriptPaths = media.chunks.flatMap((chunk) =>
		chunk.transcript ? [chunk.transcript.path] : [],
	);

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

	const refresh = () =>
		refetchAPIs([api.media.meta.queryKey({ input: { id, index } })]);

	return (
		<Card>
			<CardHeader>
				<CardTitle>Media Pipeline</CardTitle>
				<CardDescription>Recording and processing jobs.</CardDescription>
				<CardAction>
					<ButtonGroup>
						<Button variant="outline" size="sm" asChild>
							<Link href={`/medias/${id}` as "/"}>
								<FolderIcon />
								Files
							</Link>
						</Button>
						<Button variant="outline" size="sm" onClick={refresh}>
							<RefreshCwIcon />
							Refresh
						</Button>
					</ButtonGroup>
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
							{videoIndexes.length === 0 && (
								<Alert>
									<CircleAlertIcon />
									<AlertTitle>No recordings</AlertTitle>
									<AlertDescription>
										No recording has been saved for this session yet.
									</AlertDescription>
								</Alert>
							)}
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
										<DeleteButton
											id={id}
											path={`videos/${n}.mp4`}
											label="Recording"
											index={index}
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
								<CardAction>
									<RunAllButton
										id={id}
										index={index}
										media={media}
										disabled={!media.video}
										onDone={refresh}
									/>
								</CardAction>
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
											<RetryAction
												api={api.media.jobs.toAudio.mutationOptions({
													onError: handleError("toAudio"),
												})}
												input={{ id, index }}
												disabled={!media.video}
												label={media.audio ? "Retry" : "Convert"}
												onSuccess={handleSuccess(
													"toAudio",
													"Audio conversion job started",
												)}
											/>
										}
									>
										{media.audio && (
											<ItemGroup>
												<Item variant="outline">
													<ItemMedia variant="icon">
														<FileAudioIcon />
													</ItemMedia>
													<ItemContent>
														<ItemTitle>{`${index}.mp3`}</ItemTitle>
														<ItemDescription>
															{media.audio.path}
														</ItemDescription>
													</ItemContent>
													<ItemActions>
														<DownloadButton
															id={id}
															path={media.audio.path}
															label="Audio"
														/>
														<DeleteButton
															id={id}
															path={media.audio.path}
															label="Audio"
															index={index}
														/>
													</ItemActions>
												</Item>
											</ItemGroup>
										)}
									</PipelineStep>

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
											<>
												<RetryAction
													api={api.media.jobs.splitAudio.mutationOptions({
														onError: handleError("splitAudio"),
													})}
													input={{ id, index }}
													disabled={!media.audio}
													label={media.chunks.length > 0 ? "Retry" : "Convert"}
													onSuccess={handleSuccess(
														"splitAudio",
														"Audio split job started",
													)}
												/>
												<DeleteChunksButton
													id={id}
													index={index}
													target="audio"
													label="Delete chunks"
												/>
											</>
										}
									>
										{media.chunks.length > 0 && (
											<FileScroll count={media.chunks.length}>
												<ItemGroup>
													{media.chunks.map((chunk) => (
														<ChunkItem
															key={chunk.path}
															id={id}
															index={index}
															chunk={chunk}
														/>
													))}
												</ItemGroup>
											</FileScroll>
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
										children={
											transcriptPaths.length > 0 && (
												<FileScroll count={transcriptPaths.length}>
													<ItemGroup>
														{transcriptPaths.map((path) => (
															<TranscriptItem
																key={path}
																id={id}
																index={index}
																path={path}
															/>
														))}
													</ItemGroup>
												</FileScroll>
											)
										}
										actions={
											<>
												<DeleteChunksButton
													id={id}
													index={index}
													target="transcripts"
													label="Delete transcripts"
												/>
												<RetryAction
													api={api.media.transcribeAudioChunks.mutationOptions({
														onError: handleError("transcribeChunks"),
													})}
													input={{ id, index, onlyMissing: true }}
													disabled={
														media.chunks.length === 0 || chunksTranscribed
													}
													label="Retry failed"
													onSuccess={handleSuccess(
														"transcribeChunks",
														"Failed chunks transcribed",
													)}
												/>
												<RetryAction
													api={api.media.transcribeAudioChunks.mutationOptions({
														onError: handleError("transcribeChunks"),
													})}
													input={{ id, index }}
													disabled={media.chunks.length === 0}
													label={
														transcribedChunks.length > 0 ? "Retry" : "Convert"
													}
													onSuccess={handleSuccess(
														"transcribeChunks",
														"Chunks transcribed",
													)}
												/>
											</>
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
												{media.chunkSummary && (
													<Button asChild variant="outline" size="sm">
														<a
															href={
																`/analytics/slots/${id}?source=chunks` as "/"
															}
															target="_blank"
															rel="noreferrer"
														>
															<FileTextIcon />
															PDF
														</a>
													</Button>
												)}
												<RetryAction
													api={api.media.summarizeChunks.mutationOptions({
														onError: handleError("summarizeChunks"),
													})}
													input={{ id, index }}
													disabled={!chunksTranscribed}
													label={media.chunkSummary ? "Retry" : "Convert"}
													onSuccess={handleSuccess(
														"summarizeChunks",
														"Chunked transcript summarized",
													)}
												/>
											</>
										}
									/>
									<PipelineStep
										step={5}
										title="Send Report to Student"
										description="Sends the report link to the student's phone."
										actions={
											<SendToParentButton
												id={id}
												source="chunks"
												disabled={!media.chunkSummary}
											/>
										}
									/>
								</Timeline>
							</CardContent>
						</Card>

						{/*
						<Card size="sm">
							<CardHeader>
								<CardTitle>Direct</CardTitle>
								<CardDescription>
									From the full audio. Only works for audio under 30 seconds.
								</CardDescription>
							</CardHeader>
							<CardContent>
								<Timeline
									value={getActiveStep([!!media.transcript, !!media.summary])}
								>
									<PipelineStep
										step={1}
										title={
											media.transcript
												? "Audio Transcribed"
												: "Transcribe Audio"
										}
										description={
											media.transcript
												? `transcript-single/${index}.json is ready.`
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
													input={{ id, index }}
													disabled={!media.audio}
													label={media.transcript ? "Retry" : "Convert"}
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
										title={media.summary ? "Summary Created" : "Create Summary"}
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
													input={{ id, index }}
													disabled={!media.transcript}
													label={media.summary ? "Retry" : "Convert"}
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
												<>
													<Button asChild variant="outline" size="sm">
														<a
															href={`/analytics/slots/${id}` as "/"}
															target="_blank"
															rel="noreferrer"
														>
															<FileTextIcon />
															Show PDF
														</a>
													</Button>
													<ShowSummaryButton id={id} />
													<SendToParentButton id={id} />
												</>
											) : undefined
										}
									/>
								</Timeline>
							</CardContent>
						</Card>
						*/}
					</TabsContent>
				</Tabs>
			</CardContent>
		</Card>
	);
}
