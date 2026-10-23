"use client";

import type { Participant } from "@zoom/videosdk";
import ZoomVideo, { ConnectionState, RecordingStatus } from "@zoom/videosdk";
import {
	LocalScreenShareComponent,
	ScreenShareContainerComponent,
	ScreenSharePlayerComponent,
	useAudioState,
	useMyself,
	useScreenShareUsers,
	useScreenshare,
	useSession,
	useSessionUsers,
	useVideoState,
	VideoPlayerComponent,
	VideoPlayerContainerComponent,
} from "@zoom/videosdk-react";
import {
	CctvIcon,
	CctvOffIcon,
	CircleIcon,
	EllipsisIcon,
	InfoIcon,
	LogOutIcon,
	MicIcon,
	MicOffIcon,
	PhoneOffIcon,
	PinIcon,
	ScreenShareIcon,
	ScreenShareOffIcon,
	SquareIcon,
	UsersIcon,
	UserXIcon,
	VideoIcon,
	VideoOffIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { sileo as toast } from "sileo";
import { ErrorAuthCardFooter } from "@/app/_components/login";
import { Container } from "@/components/container";
import Loader from "@/components/loader";
import { Frame, FramePanel } from "@/components/reui/frame";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { MeetingDetails } from "./meeting-details";
import { ParticipantsDrawer } from "./participants-drawer";

// Self floats separately, so the main grid tops out at three others.
const MAX_REMOTE_TILES = 3;

const videoTileStyle = {
	width: "100%",
	aspectRatio: "16 / 9",
	overflow: "hidden",
	borderRadius: "var(--radius-lg)",
} as const;

type SessionUser = ReturnType<typeof useSessionUsers>[number];

function participantName(participant: Participant) {
	return participant.displayName || "Guest";
}

function isVoiceOn(participant: Participant) {
	return participant.audio !== "" && participant.muted === false;
}

function sdkErrorDescription(error: unknown) {
	if (error instanceof Error) return error.message;

	if (
		typeof error === "object" &&
		error !== null &&
		"reason" in error &&
		typeof error.reason === "string"
	) {
		return error.reason;
	}

	return undefined;
}

function RemoteUserMenu({ user }: { user: SessionUser }) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="secondary"
					size="icon-sm"
					className="absolute top-2 right-2"
					aria-label={`Actions for ${participantName(user)}`}
				>
					<EllipsisIcon />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuLabel>{participantName(user)}</DropdownMenuLabel>
				<DropdownMenuItem>
					<MicOffIcon />
					Mute
				</DropdownMenuItem>
				<DropdownMenuItem>
					<VideoOffIcon />
					Stop video
				</DropdownMenuItem>
				<DropdownMenuItem>
					<PinIcon />
					Pin
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem variant="destructive">
					<UserXIcon />
					Remove
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

function VideoTile({
	user,
	className,
	voiceOn,
	menu = false,
}: {
	user: SessionUser;
	className?: string;
	voiceOn?: boolean;
	menu?: boolean;
}) {
	const voice = voiceOn ?? isVoiceOn(user);

	return (
		<Frame className={cn("overflow-hidden p-0", className)}>
			<VideoPlayerContainerComponent style={videoTileStyle}>
				<VideoPlayerComponent user={user} />
			</VideoPlayerContainerComponent>
			<Badge variant="secondary" className="absolute bottom-2 left-2 gap-1.5">
				{voice ? <MicIcon /> : <MicOffIcon />}
				{participantName(user)}
			</Badge>
			{menu && <RemoteUserMenu user={user} />}
		</Frame>
	);
}

export function VideoChat({
	session,
	token,
	userName,
	slotId,
	canViewDetails,
	canEndMeeting,
	canRecord,
	autoRecord,
	disableVideo,
	disableAudio,
	onLeave,
	onEnd,
}: {
	session: string;
	token: string;
	userName: string;
	slotId?: string;
	canViewDetails: boolean;
	canEndMeeting: boolean;
	canRecord: boolean;
	autoRecord: boolean;
	disableVideo: boolean;
	disableAudio: boolean;
	onLeave: () => void;
	onEnd?: () => void;
}) {
	const { isError, isInSession, error } = useSession(
		session,
		token,
		userName,
		undefined,
		undefined,
		{ disableVideo, disableAudio },
	);
	const participants = useSessionUsers();
	const myself = useMyself();
	const { isVideoOn, toggleVideo } = useVideoState();
	const { isAudioMuted, isCapturingAudio, setCapture, setMute } =
		useAudioState();
	const { ScreenshareRef, startScreenshare, stopScreenshare, isScreensharing } =
		useScreenshare();
	const screenShareUsers = useScreenShareUsers();

	const [recordingStatus, setRecordingStatus] = useState(
		RecordingStatus.Stopped,
	);
	const [recordingPending, setRecordingPending] = useState(false);
	const [audioPending, setAudioPending] = useState(false);
	const autoRecordAttempted = useRef(false);
	const onEndRef = useRef(onEnd);

	// A participant list containing ourselves means the join is already live,
	// even if startAudio/startVideo are still resolving.
	const connected = isInSession || participants.length > 0;
	const isRecording =
		recordingStatus === RecordingStatus.Recording ||
		recordingStatus === RecordingStatus.Paused;
	const isAudioOn = isCapturingAudio && !isAudioMuted;

	const startRecording = useCallback(async () => {
		setRecordingPending(true);

		try {
			const recording = ZoomVideo.createClient().getRecordingClient();

			const status = recording.getCloudRecordingStatus();

			if (
				status === RecordingStatus.Recording ||
				status === RecordingStatus.Paused
			) {
				setRecordingStatus(status);
				return;
			}

			const result = await recording.startCloudRecording();
			if (result instanceof Error) throw result;

			setRecordingStatus(RecordingStatus.Recording);
			toast.success({ title: "Recording started" });
		} catch (error) {
			toast.error({
				title: "Could not start recording",
				description: sdkErrorDescription(error),
			});
		} finally {
			setRecordingPending(false);
		}
	}, []);

	const stopRecording = useCallback(async () => {
		setRecordingPending(true);

		try {
			const recording = ZoomVideo.createClient().getRecordingClient();

			if (recording.getCloudRecordingStatus() === RecordingStatus.Stopped) {
				setRecordingStatus(RecordingStatus.Stopped);
				return;
			}

			const result = await recording.stopCloudRecording();
			if (result instanceof Error) throw result;

			setRecordingStatus(RecordingStatus.Stopped);
			toast.info({ title: "Recording stopped" });
		} catch (error) {
			toast.error({
				title: "Could not stop recording",
				description: sdkErrorDescription(error),
			});
		} finally {
			setRecordingPending(false);
		}
	}, []);

	useEffect(() => {
		onEndRef.current = onEnd;
	}, [onEnd]);

	useEffect(() => {
		const client = ZoomVideo.createClient();

		function handleConnectionChange(payload: {
			state: ConnectionState;
			reason?: string;
		}) {
			if (
				payload.state === ConnectionState.Closed &&
				payload.reason === "ended by host"
			) {
				onEndRef.current?.();
			}
		}

		client.on("connection-change", handleConnectionChange);

		return () => {
			client.off("connection-change", handleConnectionChange);
		};
	}, []);

	useEffect(() => {
		if (!connected) return;

		const client = ZoomVideo.createClient();

		try {
			const recording = client.getRecordingClient();

			function handleRecordingChange(status: RecordingStatus) {
				setRecordingStatus(status);
			}

			setRecordingStatus(recording.getCloudRecordingStatus());
			client.on("recording-change", handleRecordingChange);

			return () => {
				client.off("recording-change", handleRecordingChange);
			};
		} catch {
			return;
		}
	}, [connected]);

	useEffect(() => {
		if (!isInSession || !canRecord || !autoRecord) return;
		if (autoRecordAttempted.current) return;

		autoRecordAttempted.current = true;
		void startRecording();
	}, [autoRecord, canRecord, isInSession, startRecording]);

	if (isError) {
		return (
			<Container>
				<Card>
					<CardHeader>
						<CardTitle>Unable to join the session</CardTitle>
						<CardDescription>
							{error?.reason ??
								"Something went wrong while joining the meeting."}
						</CardDescription>
					</CardHeader>
					<ErrorAuthCardFooter />
				</Card>
			</Container>
		);
	}

	if (!connected) {
		return <Loader />;
	}

	const others = participants
		.filter((participant) => participant.userId !== myself?.userId)
		.slice(0, MAX_REMOTE_TILES);

	const remoteScreenShareUsers = screenShareUsers.filter(
		(userId) => userId !== myself?.userId,
	);
	const isRemoteSharing = remoteScreenShareUsers.length > 0;

	const endMeeting = async () => {
		await ZoomVideo.createClient().leave(true);
		if (onEnd) onEnd();
		else onLeave();
	};

	const toggleMicrophone = async () => {
		if (audioPending) return;

		setAudioPending(true);

		try {
			if (!isCapturingAudio) {
				await setCapture(true, { mute: false });
				toast.success({ title: "Microphone on" });
				return;
			}

			if (isAudioMuted) {
				await setMute(false);
				toast.success({ title: "Microphone on" });
				return;
			}

			await setMute(true);
			toast.info({ title: "Microphone off" });
		} catch (error) {
			toast.error({
				title: "Could not change microphone",
				description: sdkErrorDescription(error),
			});
		} finally {
			setAudioPending(false);
		}
	};

	const toggleCamera = async () => {
		const next = !isVideoOn;
		await toggleVideo();
		if (next) toast.success({ title: "Camera on" });
		else toast.info({ title: "Camera off" });
	};

	const toggleScreenshare = async () => {
		if (isScreensharing) {
			await stopScreenshare();
			toast.info({ title: "Screen sharing stopped" });
			return;
		}

		try {
			await startScreenshare();
			toast.success({ title: "Screen sharing started" });
		} catch {
			toast.error({ title: "Could not start screen sharing" });
		}
	};

	const toggleRecording = async () => {
		if (recordingPending) return;

		if (isRecording) await stopRecording();
		else await startRecording();
	};

	return (
		<Frame className="h-full min-h-0 rounded-none p-2">
			<FramePanel
				className={cn(
					"relative grid h-full min-h-0 content-center gap-2 overflow-hidden",
					isRemoteSharing
						? "grid-cols-1"
						: others.length > 1
							? "grid-cols-2"
							: "grid-cols-1",
				)}
			>
				{isRemoteSharing && (
					<Frame className="col-span-full h-full min-h-0 overflow-hidden">
						<ScreenShareContainerComponent className="call-screenshare-remote h-full w-full">
							{remoteScreenShareUsers.map((userId) => (
								<ScreenSharePlayerComponent key={userId} userId={userId} />
							))}
						</ScreenShareContainerComponent>
					</Frame>
				)}

				{!isRemoteSharing &&
					others.map((participant) => (
						<VideoTile key={participant.userId} user={participant} menu />
					))}

				<div className="absolute right-4 bottom-4 z-10 flex flex-col gap-2">
					<Frame
						className={cn(
							"call-screenshare w-64 overflow-hidden p-0 shadow-lg",
							!isScreensharing && "hidden",
						)}
					>
						<LocalScreenShareComponent ref={ScreenshareRef} />
					</Frame>

					{myself && (
						<VideoTile
							user={myself}
							voiceOn={isAudioOn}
							className="aspect-video min-w-64 shadow-lg"
						/>
					)}
				</div>

				<div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2">
					<Frame className="shadow-lg">
						<ButtonGroup>
							<Button
								variant="secondary"
								size="icon-lg"
								onClick={() => void toggleMicrophone()}
								disabled={audioPending}
								aria-label={
									isAudioOn ? "Mute microphone" : "Turn on microphone"
								}
							>
								{audioPending ? (
									<Spinner />
								) : isAudioOn ? (
									<MicIcon />
								) : (
									<MicOffIcon />
								)}
							</Button>
							<Button
								variant="secondary"
								size="icon-lg"
								onClick={() => void toggleCamera()}
								aria-label={isVideoOn ? "Turn off camera" : "Turn on camera"}
							>
								{isVideoOn ? <VideoIcon /> : <VideoOffIcon />}
							</Button>
							<Button
								variant={isScreensharing ? "default" : "secondary"}
								size="icon-lg"
								onClick={() => void toggleScreenshare()}
								aria-label={
									isScreensharing ? "Stop sharing screen" : "Share screen"
								}
							>
								{isScreensharing ? <ScreenShareOffIcon /> : <ScreenShareIcon />}
							</Button>
							{canRecord && (
								<Button
									variant={isRecording ? "destructive" : "secondary"}
									size="icon-lg"
									onClick={() => void toggleRecording()}
									disabled={recordingPending}
									aria-label={
										isRecording ? "Stop recording" : "Start recording"
									}
								>
									{recordingPending ? (
										<Spinner />
									) : isRecording ? (
										<CctvIcon />
									) : (
										<CctvOffIcon />
									)}
								</Button>
							)}
							<ParticipantsDrawer participants={participants}>
								<Button
									variant="secondary"
									size="icon-lg"
									aria-label="Show participants"
								>
									<UsersIcon />
								</Button>
							</ParticipantsDrawer>
							{slotId && canViewDetails && (
								<MeetingDetails slotId={slotId}>
									<Button
										variant="secondary"
										size="icon-lg"
										aria-label="Show meeting details"
									>
										<InfoIcon />
									</Button>
								</MeetingDetails>
							)}
							{canEndMeeting && (
								<AlertDialog>
									<AlertDialogTrigger asChild>
										<Button
											variant="destructive"
											size="icon-lg"
											aria-label="End meeting for all"
										>
											<PhoneOffIcon />
										</Button>
									</AlertDialogTrigger>
									<AlertDialogContent>
										<AlertDialogHeader>
											<AlertDialogTitle>End meeting for all?</AlertDialogTitle>
											<AlertDialogDescription>
												Everyone will be disconnected immediately. This cannot
												be undone.
											</AlertDialogDescription>
										</AlertDialogHeader>
										<AlertDialogFooter>
											<AlertDialogCancel>Cancel</AlertDialogCancel>
											<AlertDialogAction
												variant="destructive"
												onClick={() => void endMeeting()}
											>
												End meeting
											</AlertDialogAction>
										</AlertDialogFooter>
									</AlertDialogContent>
								</AlertDialog>
							)}
							<AlertDialog>
								<AlertDialogTrigger asChild>
									<Button
										variant="destructive"
										size="icon-lg"
										aria-label="Leave session"
									>
										<LogOutIcon />
									</Button>
								</AlertDialogTrigger>
								<AlertDialogContent>
									<AlertDialogHeader>
										<AlertDialogTitle>Leave the meeting?</AlertDialogTitle>
										<AlertDialogDescription>
											You can rejoin while the meeting is still live.
										</AlertDialogDescription>
									</AlertDialogHeader>
									<AlertDialogFooter>
										<AlertDialogCancel>Stay</AlertDialogCancel>
										<AlertDialogAction variant="destructive" onClick={onLeave}>
											Leave
										</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>
						</ButtonGroup>
					</Frame>
				</div>
			</FramePanel>
		</Frame>
	);
}
