"use client";

import {
	LocalScreenShareComponent,
	ScreenShareContainerComponent,
	ScreenSharePlayerComponent,
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
	MoveIcon,
	PhoneOffIcon,
	SwitchCameraIcon,
	UsersIcon,
	VideoIcon,
	VideoOffIcon,
} from "lucide-react";
import { useState } from "react";
import { ErrorAuthCardFooter } from "@/app/_components/login";
import { Button as ArcButton } from "@/components/arc/button/button";
import { SplitButton } from "@/components/arc/split-button/split-button";
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
import { Button } from "@/components/ui/button";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ChatDrawer } from "./chat-drawer";
import { CallProvider, useCall, useDraggable } from "./hooks";
import { MeetingDetails } from "./meeting-details";
import { ParticipantsDrawer } from "./participants-drawer";
import { MAX_REMOTE_TILES, type SessionUser } from "./utils";
import { VideoTile } from "./video-tile";

const SPEAKING_LEVEL = 0.04;

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
	return (
		<CallProvider
			session={session}
			token={token}
			userName={userName}
			slotId={slotId}
			role={role}
			disableVideo={disableVideo}
			disableAudio={disableAudio}
			virtualBackground={virtualBackground}
			cameraId={cameraId}
			microphoneId={microphoneId}
			speakerId={speakerId}
			onLeave={onLeave}
			onEnd={onEnd}
		>
			<CallView
				avatar={avatar}
				canViewDetails={canViewDetails}
				canEndMeeting={canEndMeeting}
				canRecord={canRecord}
			/>
		</CallProvider>
	);
}

function DragHandle({
	handleProps,
}: {
	handleProps: ReturnType<typeof useDraggable>["handleProps"];
}) {
	return (
		<Button
			type="button"
			size="icon-sm"
			variant="secondary"
			aria-label="Move tile"
			className="absolute top-2 right-2 cursor-grab touch-none opacity-0 transition-opacity duration-200 ease-out active:cursor-grabbing group-hover:opacity-100"
			{...handleProps}
		>
			<MoveIcon />
		</Button>
	);
}

function FloatingTile({ participant }: { participant: SessionUser }) {
	const drag = useDraggable();

	return (
		<div
			ref={drag.ref}
			className="absolute z-10"
			style={
				drag.position
					? { left: drag.position.left, top: drag.position.top }
					: { left: 16, bottom: 16 }
			}
		>
			<VideoTile
				user={participant}
				avatar={participant.avatar}
				className="group aspect-video min-w-64 shadow-lg"
				handle={<DragHandle handleProps={drag.handleProps} />}
			/>
		</div>
	);
}

function CallView({
	avatar,
	canViewDetails,
	canEndMeeting,
	canRecord,
}: {
	avatar?: string;
	canViewDetails: boolean;
	canEndMeeting: boolean;
	canRecord: boolean;
}) {
	const call = useCall();
	const [drawer, setDrawer] = useState<"participants" | "details" | null>(null);
	const selfDrag = useDraggable();

	if (call.isError) {
		return (
			<Container>
				<Card>
					<CardHeader>
						<CardTitle>Unable to join the session</CardTitle>
						<CardDescription>
							{call.error?.reason ??
								"Something went wrong while joining the meeting."}
						</CardDescription>
					</CardHeader>
					<ErrorAuthCardFooter />
				</Card>
			</Container>
		);
	}

	if (!call.connected) {
		return <Loader />;
	}

	const others = call.participants
		.filter((participant) => participant.userId !== call.myself?.userId)
		.sort(
			(a, b) =>
				Number(b.userId === call.pinnedUserId) -
				Number(a.userId === call.pinnedUserId),
		)
		.slice(0, MAX_REMOTE_TILES);

	const remoteScreenShareUsers = call.screenShareUsers.filter(
		(userId) => userId !== call.myself?.userId,
	);
	const isRemoteSharing = remoteScreenShareUsers.length > 0;
	const hasDetails = Boolean(call.slotId && canViewDetails);
	const speaking = call.micLevel > SPEAKING_LEVEL;

	const microphoneActions = call.micDevices.length
		? call.micDevices.map((device) => ({
				label: device.label || "Default microphone",
				onSelect: () => void call.switchMicrophone(device.deviceId),
			}))
		: [{ label: "No microphone found", disabled: true }];

	const cameraActions = [
		{
			label: "Flip camera",
			icon: <SwitchCameraIcon />,
			onSelect: () => void call.flipCamera(),
		},
		...(call.cameraDevices.length
			? call.cameraDevices.map((device) => ({
					label: device.label || "Default camera",
					onSelect: () => void call.switchCamera(device.deviceId),
				}))
			: [{ label: "No camera found", disabled: true }]),
		{
			label: call.backgroundEnabled ? "Background off" : "Background on",
			icon: call.backgroundEnabled ? <ImageOffIcon /> : <ImageIcon />,
			onSelect: () => void call.setVirtualBackgroundOn(!call.backgroundEnabled),
		},
	];
	const sharingParticipants = call.participants.filter(
		(participant) =>
			participant.userId !== call.myself?.userId &&
			remoteScreenShareUsers.includes(participant.userId),
	);

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

				{isRemoteSharing &&
					sharingParticipants.map((participant) => (
						<FloatingTile key={participant.userId} participant={participant} />
					))}

				{!isRemoteSharing &&
					others.map((participant) => (
						<VideoTile
							key={participant.userId}
							user={participant}
							avatar={participant.avatar}
							menu={{
								pinned: call.pinnedUserId === participant.userId,
								moderator: call.moderator,
								onPin: () => call.togglePin(participant.userId),
								onMute: () => void call.muteParticipant(participant.userId),
								onRemove: () => void call.removeParticipant(participant.userId),
							}}
						/>
					))}

				<div
					ref={selfDrag.ref}
					className="absolute z-10 flex flex-col gap-2"
					style={
						selfDrag.position
							? { left: selfDrag.position.left, top: selfDrag.position.top }
							: { right: 16, top: "50%" }
					}
				>
					<Frame
						className={cn(
							"call-screenshare w-64 overflow-hidden p-0 shadow-lg",
							!call.isScreensharing && "hidden",
						)}
					>
						<LocalScreenShareComponent ref={call.ScreenshareRef} />
					</Frame>

					{call.myself && (
						<VideoTile
							user={call.myself}
							voiceOn={call.isAudioOn}
							videoOn={call.isVideoOn}
							role={call.role}
							avatar={avatar}
							self
							className="group min-w-64 shadow-lg"
							handle={
								<Button
									type="button"
									size="icon-sm"
									variant="secondary"
									aria-label="Move camera"
									className="absolute top-2 right-2 cursor-grab touch-none opacity-0 transition-opacity duration-200 ease-out active:cursor-grabbing group-hover:opacity-100"
									{...selfDrag.handleProps}
								>
									<MoveIcon />
								</Button>
							}
						/>
					)}
				</div>

				<div className="absolute bottom-8 left-1/2 z-10 flex w-screen -translate-x-1/2 flex-wrap justify-center gap-2 px-2">
					<SplitButton
						label={call.isAudioOn ? "Microphone on" : "Microphone off"}
						icon={call.isAudioOn ? <MicIcon /> : <MicOffIcon />}
						variant={call.isAudioOn ? "success" : "secondary"}
						size="lg"
						style={{
							boxShadow: speaking
								? `0 0 ${8 + Math.round(call.micLevel * 20)}px var(--success)`
								: undefined,
						}}
						onClick={() => void call.toggleMicrophone()}
						actions={microphoneActions}
					/>
					<SplitButton
						label={call.isVideoOn ? "Camera on" : "Camera off"}
						icon={call.isVideoOn ? <VideoIcon /> : <VideoOffIcon />}
						variant={call.isVideoOn ? "success" : "secondary"}
						size="lg"
						onClick={() => void call.setCameraOn(!call.isVideoOn)}
						actions={cameraActions}
					/>
					<ArcButton
						size="lg"
						variant={call.isScreensharing ? "success" : "secondary"}
						loading={call.screensharePending}
						onClick={() => void call.toggleScreenshare()}
					>
						{call.isScreensharing ? <MonitorDot /> : <MonitorOff />}
						{call.isScreensharing ? "Screen sharing on" : "Screen sharing off"}
					</ArcButton>
					{canRecord && (
						<ArcButton
							size="lg"
							variant={call.isRecording ? "success" : "secondary"}
							loading={call.recordingPending}
							onClick={() => void call.toggleRecording()}
						>
							{call.isRecording ? <CctvIcon /> : <CctvOffIcon />}
							{call.isRecording ? "Recording on" : "Recording off"}
						</ArcButton>
					)}
					<ChatDrawer>
						<ArcButton
							size="lg"
							variant={call.unread > 0 ? "warning" : "secondary"}
						>
							<MessageSquareIcon />
							Chat
						</ArcButton>
					</ChatDrawer>
					{hasDetails && (
						<SplitButton
							label="Participants"
							icon={<UsersIcon />}
							variant="secondary"
							size="lg"
							onClick={() => setDrawer("participants")}
							actions={[
								{
									label: "Meeting details",
									icon: <InfoIcon />,
									onSelect: () => setDrawer("details"),
								},
							]}
						/>
					)}
					{!hasDetails && (
						<ArcButton
							size="lg"
							variant="secondary"
							onClick={() => setDrawer("participants")}
						>
							<UsersIcon />
							Participants
						</ArcButton>
					)}
					{canEndMeeting && (
						<AlertDialog>
							<AlertDialogTrigger asChild>
								<ArcButton size="lg" variant="danger">
									<PhoneOffIcon />
									End for all
								</ArcButton>
							</AlertDialogTrigger>
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
										onClick={() => void call.endMeeting()}
									>
										End meeting
									</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
					)}
					<AlertDialog>
						<AlertDialogTrigger asChild>
							<ArcButton size="lg" variant="danger">
								<LogOutIcon />
								Leave
							</ArcButton>
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
								<AlertDialogAction
									variant="destructive"
									onClick={() => void call.leaveMeeting()}
								>
									Leave
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</div>

				<ParticipantsDrawer
					open={drawer === "participants"}
					onOpenChange={(open) => setDrawer(open ? "participants" : null)}
				/>

				{call.slotId && canViewDetails && (
					<MeetingDetails
						slotId={call.slotId}
						open={drawer === "details"}
						onOpenChange={(open) => setDrawer(open ? "details" : null)}
					/>
				)}
			</FramePanel>
		</div>
	);
}
