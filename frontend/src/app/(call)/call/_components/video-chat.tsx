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
	EllipsisIcon,
	InfoIcon,
	LogOutIcon,
	MicIcon,
	MicOffIcon,
	PhoneOffIcon,
	PinIcon,
	ScreenShareIcon,
	ScreenShareOffIcon,
	UserIcon,
	UsersIcon,
	UserXIcon,
	VideoIcon,
	VideoOffIcon,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { sileo as toast } from "sileo";
import { ErrorAuthCardFooter } from "@/app/_components/login";
import {
	ExpandingButtonGroup,
	type ExpandingButtonGroupItem,
} from "@/components/arc/expanding-button-group/expanding-button-group";
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
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { useJoinPreferences } from "./call-preferences";
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

function participantRole(participant: Participant) {
	return participant.userIdentity || participant.userKey;
}

function roleLabel(role: string) {
	const label = role.replaceAll("_", " ");

	return label.charAt(0).toUpperCase() + label.slice(1);
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
	videoOn,
	role: roleProp,
	avatar,
	backgroundImage,
	menu = false,
}: {
	user: SessionUser;
	className?: string;
	voiceOn?: boolean;
	videoOn?: boolean;
	role?: string;
	avatar?: string;
	backgroundImage?: string;
	menu?: boolean;
}) {
	const voice = voiceOn ?? isVoiceOn(user);
	const video = videoOn ?? user.bVideoOn;
	const role = roleProp ?? participantRole(user) ?? "guest";
	const roleName = roleLabel(role);
	const isTeacher = role === "teacher";
	const name = participantName(user);

	return (
		<Frame className={cn("overflow-hidden p-0", className)}>
			<VideoPlayerContainerComponent style={videoTileStyle}>
				<VideoPlayerComponent user={user} />
			</VideoPlayerContainerComponent>
			{!video && isTeacher && backgroundImage && (
				<Image
					src={backgroundImage}
					alt=""
					fill
					sizes="(max-width: 640px) 100vw, 33vw"
					className="select-none object-cover"
					draggable={false}
				/>
			)}
			{!video && (
				<div className="absolute inset-0">
					<div className="flex size-full flex-row items-center justify-center gap-3">
						<Avatar size="lg">
							<AvatarImage src={avatar} alt={name} />
							<AvatarFallback>
								<UserIcon />
							</AvatarFallback>
						</Avatar>
						<div className="flex flex-col items-start gap-1">
							<span className="font-medium text-sm">{name}</span>
							<span className="text-muted-foreground text-xs">{roleName}</span>
						</div>
					</div>
				</div>
			)}
			<Badge variant="secondary" className="absolute bottom-2 left-2 gap-1.5">
				{voice ? <MicIcon /> : <MicOffIcon />}
				{video && name}
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
	role,
	avatar,
	backgroundImage,
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
	role: string;
	avatar?: string;
	backgroundImage?: string;
	disableVideo: boolean;
	disableAudio: boolean;
	onLeave: () => void;
	onEnd?: () => void;
}) {
	const [joinOptions] = useState(() => ({ disableVideo, disableAudio }));
	const { isError, isInSession, error } = useSession(
		session,
		token,
		userName,
		undefined,
		undefined,
		joinOptions,
	);
	const { setCamera, setMic } = useJoinPreferences();
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
	const [overlay, setOverlay] = useState<
		"participants" | "details" | "end" | "leave" | null
	>(null);
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
				void setMic(true);
				toast.success({ title: "Microphone on" });
				return;
			}

			if (isAudioMuted) {
				await setMute(false);
				void setMic(true);
				toast.success({ title: "Microphone on" });
				return;
			}

			await setMute(true);
			void setMic(false);
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
		void setCamera(next);
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

	const callActions: ExpandingButtonGroupItem[] = [
		{
			id: "microphone",
			label: isAudioOn ? "Mute" : "Unmute",
			icon: audioPending ? (
				<Spinner />
			) : isAudioOn ? (
				<MicIcon />
			) : (
				<MicOffIcon />
			),
			disabled: audioPending,
			onSelect: toggleMicrophone,
		},
		{
			id: "camera",
			label: isVideoOn ? "Camera off" : "Camera on",
			icon: isVideoOn ? <VideoIcon /> : <VideoOffIcon />,
			onSelect: toggleCamera,
		},
		{
			id: "screenshare",
			label: isScreensharing ? "Stop sharing" : "Share screen",
			icon: isScreensharing ? <ScreenShareOffIcon /> : <ScreenShareIcon />,
			onSelect: toggleScreenshare,
		},
	];

	if (canRecord) {
		callActions.push({
			id: "recording",
			label: isRecording ? "Stop recording" : "Start recording",
			icon: recordingPending ? (
				<Spinner />
			) : isRecording ? (
				<CctvIcon />
			) : (
				<CctvOffIcon />
			),
			tone: isRecording ? "danger" : "neutral",
			disabled: recordingPending,
			onSelect: toggleRecording,
		});
	}

	callActions.push({
		id: "participants",
		label: "Participants",
		icon: <UsersIcon />,
		onSelect: () => setOverlay("participants"),
	});

	if (slotId && canViewDetails) {
		callActions.push({
			id: "details",
			label: "Meeting details",
			icon: <InfoIcon />,
			onSelect: () => setOverlay("details"),
		});
	}

	if (canEndMeeting) {
		callActions.push({
			id: "end",
			label: "End for all",
			icon: <PhoneOffIcon />,
			tone: "danger",
			onSelect: () => setOverlay("end"),
		});
	}

	callActions.push({
		id: "leave",
		label: "Leave",
		icon: <LogOutIcon />,
		tone: "danger",
		onSelect: () => setOverlay("leave"),
	});

	return (
		<div className="h-full min-h-64 p-2">
			<FramePanel
				className={cn(
					"relative grid h-full min-h-0 content-center gap-2 overflow-hidden border-none",
					isRemoteSharing
						? "grid-cols-1"
						: others.length > 1
							? "grid-cols-2"
							: "grid-cols-1",
				)}
			>
				{isRemoteSharing && (
					<Frame className="absolute inset-0 overflow-hidden p-0">
						<ScreenShareContainerComponent className="call-screenshare-remote h-full w-full">
							{remoteScreenShareUsers.map((userId) => (
								<ScreenSharePlayerComponent key={userId} userId={userId} />
							))}
						</ScreenShareContainerComponent>
					</Frame>
				)}

				{!isRemoteSharing &&
					others.map((participant) => (
						<VideoTile
							key={participant.userId}
							user={participant}
							avatar={participant.avatar}
							backgroundImage={backgroundImage}
							menu
						/>
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
							videoOn={isVideoOn}
							role={role}
							avatar={avatar}
							backgroundImage={backgroundImage}
							className="aspect-video min-w-64 shadow-lg"
						/>
					)}
				</div>

				<div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2">
					<ExpandingButtonGroup
						label="Call actions"
						defaultExpanded={null}
						items={callActions}
						className="shadow-lg"
					/>
				</div>

				<ParticipantsDrawer
					participants={participants}
					open={overlay === "participants"}
					onOpenChange={(open) => setOverlay(open ? "participants" : null)}
				/>

				{slotId && canViewDetails && (
					<MeetingDetails
						slotId={slotId}
						open={overlay === "details"}
						onOpenChange={(open) => setOverlay(open ? "details" : null)}
					/>
				)}

				{canEndMeeting && (
					<AlertDialog
						open={overlay === "end"}
						onOpenChange={(open) => setOverlay(open ? "end" : null)}
					>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>End meeting for all?</AlertDialogTitle>
								<AlertDialogDescription>
									Everyone will be disconnected immediately. This cannot be
									undone.
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

				<AlertDialog
					open={overlay === "leave"}
					onOpenChange={(open) => setOverlay(open ? "leave" : null)}
				>
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
			</FramePanel>
		</div>
	);
}
