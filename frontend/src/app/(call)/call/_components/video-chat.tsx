"use client";

import { useMutation } from "@tanstack/react-query";
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
} from "@zoom/videosdk-react";
import {
	CctvIcon,
	CctvOffIcon,
	ImageIcon,
	ImageOffIcon,
	InfoIcon,
	LogOutIcon,
	MessageSquareIcon,
	MicIcon,
	MicOffIcon,
	MonitorDot,
	MonitorOff,
	PhoneOffIcon,
	SwitchCameraIcon,
	UsersIcon,
	VideoIcon,
	VideoOffIcon,
} from "lucide-react";
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
import { Button } from "@/components/ui/button";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemMedia,
	ItemTitle,
} from "@/components/ui/item";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { api } from "@/hooks/api";
import { cn } from "@/lib/utils";
import { useJoinPreferences } from "./call-preferences";
import { ChatDrawer, type ChatMessage } from "./chat-drawer";
import { MeetingDetails } from "./meeting-details";
import { ParticipantsDrawer } from "./participants-drawer";
import {
	MAX_REMOTE_TILES,
	participantRole,
	roleLabel,
	sdkErrorDescription,
	VIRTUAL_BACKGROUND,
} from "./utils";
import { VideoTile } from "./video-tile";

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
	disableVideo,
	disableAudio,
	virtualBackground = false,
	cameraId = null,
	microphoneId = null,
	speakerId = null,
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
	disableVideo: boolean;
	disableAudio: boolean;
	virtualBackground?: boolean;
	cameraId?: string | null;
	microphoneId?: string | null;
	speakerId?: string | null;
	onLeave: () => void;
	onEnd?: () => void;
}) {
	const [joinOptions] = useState(() => ({
		disableVideo,
		disableAudio,
		virtualBackground,
		videoOptions: { cameraId: cameraId ?? undefined },
		audioOptions: {
			microphoneId: microphoneId ?? undefined,
			speakerId: speakerId ?? undefined,
		},
	}));
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
	const { isVideoOn } = useVideoState();
	const { isAudioMuted, isCapturingAudio } = useAudioState();
	const { ScreenshareRef, startScreenshare, stopScreenshare, isScreensharing } =
		useScreenshare();
	const screenShareUsers = useScreenShareUsers();

	const [recordingStatus, setRecordingStatus] = useState(
		RecordingStatus.Stopped,
	);
	const [recordingPending, setRecordingPending] = useState(false);
	const [audioPending, setAudioPending] = useState(false);
	const [overlay, setOverlay] = useState<
		"participants" | "details" | "camera" | "end" | "leave" | null
	>(null);
	const [virtualBackgroundEnabled, setVirtualBackgroundEnabled] =
		useState(virtualBackground);
	const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
	const [pinnedUserId, setPinnedUserId] = useState<number | null>(null);
	const myUserIdRef = useRef<string | undefined>(undefined);
	const onEndRef = useRef(onEnd);
	const endMeetingMutation = useMutation(
		api.meeting.end.mutationOptions({
			onError: (error) =>
				toast.error({
					title: "Could not mark meeting as ended",
					description: error.message,
				}),
		}),
	);

	const chatRoles = new Map(
		participants.map((participant) => [
			participant.userId.toString(),
			roleLabel(participantRole(participant) ?? "guest"),
		]),
	);
	const myChatId = myself?.userId.toString() ?? myUserIdRef.current;
	if (myChatId) chatRoles.set(myChatId, roleLabel(role));

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
		myUserIdRef.current = myself?.userId.toString();
	}, [myself?.userId]);

	useEffect(() => {
		if (!connected) return;

		const client = ZoomVideo.createClient();
		const chat = client.getChatClient();

		function handleChatMessage(payload: {
			message: string;
			sender: { userId: number; name: string };
		}) {
			const senderId = payload.sender.userId.toString();
			if (senderId === myUserIdRef.current) return;

			setChatMessages((previous) => [
				...previous,
				{
					id: crypto.randomUUID(),
					senderId,
					senderName: payload.sender.name,
					text: payload.message,
				},
			]);
		}

		client.on("chat-on-message", handleChatMessage);
		setChatMessages(
			chat.getHistory().map((item) => ({
				id: crypto.randomUUID(),
				senderId: item.sender.userId.toString(),
				senderName: item.sender.name,
				text: item.message ?? "",
			})),
		);

		return () => {
			client.off("chat-on-message", handleChatMessage);
		};
	}, [connected]);

	useEffect(() => {
		if (!connected || !isVideoOn || !virtualBackgroundEnabled) return;

		ZoomVideo.createClient()
			.getMediaStream()
			.updateVirtualBackgroundImage(VIRTUAL_BACKGROUND)
			.catch((error: unknown) =>
				toast.error({
					title: "Could not apply virtual background",
					description: sdkErrorDescription(error),
				}),
			);
	}, [connected, isVideoOn, virtualBackgroundEnabled]);

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

	const moderator = Boolean(myself?.isHost || myself?.isManager);

	const others = participants
		.filter((participant) => participant.userId !== myself?.userId)
		.sort(
			(a, b) =>
				Number(b.userId === pinnedUserId) - Number(a.userId === pinnedUserId),
		)
		.slice(0, MAX_REMOTE_TILES);

	const remoteScreenShareUsers = screenShareUsers.filter(
		(userId) => userId !== myself?.userId,
	);
	const isRemoteSharing = remoteScreenShareUsers.length > 0;
	const sharingParticipants = participants.filter(
		(participant) =>
			participant.userId !== myself?.userId &&
			remoteScreenShareUsers.includes(participant.userId),
	);

	const sendChat = (text: string) => {
		void ZoomVideo.createClient().getChatClient().sendToAll(text);
		setChatMessages((previous) => [
			...previous,
			{
				id: crypto.randomUUID(),
				senderId: myself?.userId.toString() ?? "",
				senderName: myself?.displayName ?? userName,
				text,
			},
		]);
	};

	const releaseMedia = async () => {
		const client = ZoomVideo.createClient();
		const stream = client.getMediaStream();

		if (isScreensharing) await stopScreenshare().catch(() => undefined);
		if (isVideoOn) await stream.stopVideo().catch(() => undefined);
		if (isCapturingAudio) await stream.stopAudio().catch(() => undefined);
	};

	const endMeeting = async () => {
		if (slotId && ["admin", "scheduler"].includes(role)) {
			await endMeetingMutation
				.mutateAsync({ id: slotId })
				.catch(() => undefined);
		}

		await releaseMedia();
		await ZoomVideo.createClient().leave(true);
		if (onEnd) onEnd();
		else onLeave();
	};

	const togglePin = (userId: number) => {
		setPinnedUserId((current) => (current === userId ? null : userId));
	};

	const muteParticipant = async (userId: number) => {
		try {
			const result = await ZoomVideo.createClient()
				.getMediaStream()
				.muteAudio(userId);
			if (result) throw result;
			toast.info({ title: "Participant muted" });
		} catch (error) {
			toast.error({
				title: "Could not mute participant",
				description: sdkErrorDescription(error),
			});
		}
	};

	const removeParticipant = async (userId: number) => {
		try {
			const result = await ZoomVideo.createClient().removeUser(userId);
			if (result) throw result;
			toast.info({ title: "Participant removed" });
		} catch (error) {
			toast.error({
				title: "Could not remove participant",
				description: sdkErrorDescription(error),
			});
		}
	};

	const leaveMeeting = async () => {
		await releaseMedia();
		await ZoomVideo.createClient().leave();
		onLeave();
	};

	const toggleMicrophone = async () => {
		if (audioPending) return;

		setAudioPending(true);

		const stream = ZoomVideo.createClient().getMediaStream();

		try {
			if (!isCapturingAudio) {
				const result = await stream.startAudio();
				if (result) throw result;
				void setMic(true);
				toast.success({ title: "Microphone on" });
				return;
			}

			if (isAudioMuted) {
				const result = await stream.unmuteAudio();
				if (result) throw result;
				void setMic(true);
				toast.success({ title: "Microphone on" });
				return;
			}

			const result = await stream.muteAudio();
			if (result) throw result;
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

	const setCameraOn = async (next: boolean) => {
		const stream = ZoomVideo.createClient().getMediaStream();

		try {
			if (next) {
				await stream.startVideo(
					virtualBackgroundEnabled
						? { virtualBackground: { imageUrl: VIRTUAL_BACKGROUND } }
						: undefined,
				);
			} else {
				await stream.stopVideo();
			}
		} catch (error) {
			toast.error({
				title: "Could not change camera",
				description: sdkErrorDescription(error),
			});
			return;
		}

		void setCamera(next);
		if (next) toast.success({ title: "Camera on" });
		else toast.info({ title: "Camera off" });
	};

	const flipCamera = async () => {
		const stream = ZoomVideo.createClient().getMediaStream();
		const cameras = stream.getCameraList();
		const index = cameras.findIndex(
			(camera) => camera.deviceId === stream.getActiveCamera(),
		);
		const next = cameras[(index + 1) % cameras.length];

		if (!next) {
			toast.error({ title: "No other camera found" });
			return;
		}

		try {
			await stream.switchCamera(next.deviceId);
			toast.success({ title: "Camera switched" });
		} catch (error) {
			toast.error({
				title: "Could not switch camera",
				description: sdkErrorDescription(error),
			});
		}
	};

	const setVirtualBackgroundOn = async (next: boolean) => {
		try {
			if (isVideoOn) {
				await ZoomVideo.createClient()
					.getMediaStream()
					.updateVirtualBackgroundImage(next ? VIRTUAL_BACKGROUND : undefined);
			}
		} catch (error) {
			toast.error({
				title: "Could not change background",
				description: sdkErrorDescription(error),
			});
			return;
		}

		setVirtualBackgroundEnabled(next);
	};

	const cameraStatus = isVideoOn ? "On" : "Off";
	const virtualBackgroundSupported =
		isInSession &&
		ZoomVideo.createClient().getMediaStream().isSupportVirtualBackground();

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
			onSelect: () => void setCameraOn(!isVideoOn),
		},
		{
			id: "screenshare",
			label: isScreensharing ? "Stop sharing" : "Share screen",
			icon: isScreensharing ? <MonitorDot /> : <MonitorOff />,
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
		id: "chat",
		label: "Chat",
		icon: <MessageSquareIcon />,
		wrap: (button) => (
			<ChatDrawer
				messages={chatMessages}
				myUserId={myself?.userId.toString()}
				roles={chatRoles}
				slotId={slotId}
				onSend={sendChat}
			>
				{button}
			</ChatDrawer>
		),
	});

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

				{isRemoteSharing && (
					<div className="absolute bottom-4 left-4 z-10 flex flex-col gap-2">
						{sharingParticipants.map((participant) => (
							<VideoTile
								key={participant.userId}
								user={participant}
								avatar={participant.avatar}
								className="aspect-video min-w-64 shadow-lg"
							/>
						))}
					</div>
				)}

				{!isRemoteSharing &&
					others.map((participant) => (
						<VideoTile
							key={participant.userId}
							user={participant}
							avatar={participant.avatar}
							menu={{
								pinned: pinnedUserId === participant.userId,
								moderator,
								onPin: () => togglePin(participant.userId),
								onMute: () => void muteParticipant(participant.userId),
								onRemove: () => void removeParticipant(participant.userId),
							}}
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
							self
							className="group min-w-64 shadow-lg"
						>
							<div className="animatein hidden group-hover:block">
								<FieldGroup className="gap-1.5 p-1.5">
									<FieldLabel htmlFor="tile-microphone-switch">
										<Field className="h-10" orientation="horizontal">
											<ItemMedia variant="icon">
												{audioPending ? (
													<Spinner />
												) : isAudioOn ? (
													<MicIcon />
												) : (
													<MicOffIcon />
												)}
											</ItemMedia>
											<ItemContent>
												<ItemTitle>Microphone</ItemTitle>
											</ItemContent>
											<ItemActions>
												<Switch
													id="tile-microphone-switch"
													aria-label="Microphone"
													checked={isAudioOn}
													disabled={audioPending}
													onCheckedChange={() => toggleMicrophone()}
												/>
											</ItemActions>
										</Field>
									</FieldLabel>
									<FieldLabel htmlFor="tile-camera-switch">
										<Field className="h-10" orientation="horizontal">
											<ItemMedia variant="icon">
												{isVideoOn ? <VideoIcon /> : <VideoOffIcon />}
											</ItemMedia>
											<ItemContent>
												<ItemTitle>Camera</ItemTitle>
											</ItemContent>
											<ItemActions>
												<Switch
													id="tile-camera-switch"
													aria-label="Camera"
													checked={isVideoOn}
													onCheckedChange={(checked) =>
														void setCameraOn(checked)
													}
												/>
											</ItemActions>
										</Field>
									</FieldLabel>
									<FieldLabel htmlFor="tile-background-switch">
										<Field className="h-10" orientation="horizontal">
											<ItemMedia variant="icon">
												{virtualBackgroundEnabled ? (
													<ImageIcon />
												) : (
													<ImageOffIcon />
												)}
											</ItemMedia>
											<ItemContent>
												<ItemTitle>Background</ItemTitle>
											</ItemContent>
											<ItemActions>
												<Switch
													id="tile-background-switch"
													aria-label="Virtual background"
													checked={virtualBackgroundEnabled}
													disabled={!isVideoOn || !virtualBackgroundSupported}
													onCheckedChange={(checked) =>
														void setVirtualBackgroundOn(checked)
													}
												/>
											</ItemActions>
										</Field>
									</FieldLabel>
									<FieldLabel htmlFor="tile-flip-camera">
										<Field className="h-10" orientation="horizontal">
											<ItemMedia variant="icon">
												<SwitchCameraIcon />
											</ItemMedia>
											<ItemContent>
												<ItemTitle>Flip camera</ItemTitle>
											</ItemContent>
											<ItemActions>
												<Button
													id="tile-flip-camera"
													type="button"
													size="icon-sm"
													variant="ghost"
													aria-label="Flip camera"
													disabled={!isVideoOn}
													onClick={() => void flipCamera()}
												>
													<SwitchCameraIcon />
												</Button>
											</ItemActions>
										</Field>
									</FieldLabel>
								</FieldGroup>
								<Separator />
							</div>
						</VideoTile>
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

				<Dialog
					open={overlay === "camera"}
					onOpenChange={(open) => setOverlay(open ? "camera" : null)}
				>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Camera</DialogTitle>
							<DialogDescription>
								Your camera is currently {cameraStatus}.
							</DialogDescription>
						</DialogHeader>
						{myself && (
							<VideoTile
								user={myself}
								voiceOn={isAudioOn}
								videoOn={isVideoOn}
								role={role}
								avatar={avatar}
								self
								className="aspect-video"
							/>
						)}
						<FieldGroup>
							<FieldLabel htmlFor="camera-switch">
								<Field orientation="horizontal" className="items-start">
									<ItemMedia variant="icon">
										{isVideoOn ? <VideoIcon /> : <VideoOffIcon />}
									</ItemMedia>
									<ItemContent>
										<ItemTitle>Camera</ItemTitle>
									</ItemContent>
									<ItemActions>
										<Switch
											id="camera-switch"
											aria-label="Camera"
											checked={isVideoOn}
											onCheckedChange={(checked) => void setCameraOn(checked)}
										/>
									</ItemActions>
								</Field>
							</FieldLabel>
							<FieldLabel htmlFor="virtual-background-switch">
								<Field orientation="horizontal" className="items-start">
									<ItemMedia variant="icon">
										{virtualBackgroundEnabled ? (
											<ImageIcon />
										) : (
											<ImageOffIcon />
										)}
									</ItemMedia>
									<ItemContent>
										<ItemTitle>Virtual background</ItemTitle>
										<ItemDescription>
											Replace your background with the banner.
										</ItemDescription>
									</ItemContent>
									<ItemActions>
										<Switch
											id="virtual-background-switch"
											aria-label="Virtual background"
											checked={virtualBackgroundEnabled}
											disabled={!isVideoOn || !virtualBackgroundSupported}
											onCheckedChange={(checked) =>
												void setVirtualBackgroundOn(checked)
											}
										/>
									</ItemActions>
								</Field>
							</FieldLabel>
						</FieldGroup>
					</DialogContent>
				</Dialog>

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
							<AlertDialogAction
								variant="destructive"
								onClick={() => void leaveMeeting()}
							>
								Leave
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</FramePanel>
		</div>
	);
}
