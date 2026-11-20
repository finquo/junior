"use client";

import {
	LocalScreenShareComponent,
	ScreenShareContainerComponent,
	ScreenSharePlayerComponent,
} from "@zoom/videosdk-react";
import {
	CctvIcon,
	CctvOffIcon,
	ChevronDownIcon,
	ImageIcon,
	ImageOffIcon,
	InfoIcon,
	LogOutIcon,
	MessageSquareIcon,
	MessageSquarePlusIcon,
	MicIcon,
	MicOffIcon,
	MonitorDot,
	MonitorOff,
	MoonIcon,
	PhoneOffIcon,
	SunIcon,
	SwitchCameraIcon,
	UsersIcon,
	VideoIcon,
	VideoOffIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import type React from "react";
import { useState } from "react";
import { ErrorAuthCardFooter } from "@/app/_components/login";
import { Container } from "@/components/container";
import { FeedbackDialog } from "@/components/custom/feedback-dialog";
import Loader from "@/components/loader";
import { Frame, FramePanel } from "@/components/reui/frame";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { ChatDrawer } from "./chat-drawer";
import { CallProvider, useCall, useDraggable } from "./hooks";
import { MeetingDetails } from "./meeting-details";
import { ParticipantsDrawer } from "./participants-drawer";
import { QuizPopup } from "./quiz-popup";
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

function FloatingTile({ participant }: { participant: SessionUser }) {
	const drag = useDraggable();

	return (
		<div
			ref={drag.ref}
			className="absolute z-10 cursor-grab touch-none active:cursor-grabbing"
			{...drag.dragProps}
			style={
				drag.position
					? { left: drag.position.left, top: drag.position.top }
					: { left: 16, bottom: 16 }
			}
		>
			<VideoTile
				user={participant}
				avatar={participant.avatar}
				className="aspect-video min-w-64 shadow-lg"
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
	const { resolvedTheme, setTheme } = useTheme();
	const isMobile = useIsMobile();
	const controlSize = isMobile ? "sm" : "lg";
	const [drawer, setDrawer] = useState<
		"participants" | "details" | "chat" | null
	>(null);
	const [feedbackOpen, setFeedbackOpen] = useState(false);
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
	const themeAction = {
		label: resolvedTheme === "light" ? "Dark theme" : "Light theme",
		icon: resolvedTheme === "light" ? <MoonIcon /> : <SunIcon />,
		onSelect: () => setTheme(resolvedTheme === "light" ? "dark" : "light"),
	};

	type MenuAction = {
		label: string;
		icon?: React.ReactNode;
		onSelect?: () => void;
		disabled?: boolean;
	};

	const microphoneActions: MenuAction[] = call.micDevices.length
		? call.micDevices.map((device) => ({
				label: device.label || "Default microphone",
				onSelect: () => void call.switchMicrophone(device.deviceId),
			}))
		: [{ label: "No microphone found", disabled: true }];

	const cameraActions: MenuAction[] = [
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
					"relative h-full min-h-0 gap-2 border-none",
					isMobile
						? "justify-center-safe flex flex-col overflow-y-auto"
						: cn(
								"grid content-center overflow-hidden",
								isRemoteSharing
									? "grid-cols-1"
									: others.length > 1
										? "grid-cols-2"
										: "grid-cols-1",
							),
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
					className="absolute z-10 flex cursor-grab touch-none flex-col gap-2 active:cursor-grabbing"
					{...selfDrag.dragProps}
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
							className="min-w-64 shadow-lg"
						/>
					)}
				</div>

				<div className="absolute bottom-8 left-1/2 z-10 flex w-screen -translate-x-1/2 flex-wrap justify-center gap-2 px-2">
					<ButtonGroup
						style={
							call.isAudioOn
								? {
										borderRadius: 30,
										outlineStyle: "solid",
										outlineColor: "var(--primary)",
										outlineOffset: Math.round(call.micLevel * 10),
									}
								: undefined
						}
					>
						<Button
							variant={call.isAudioOn ? "default" : "outline"}
							size={controlSize}
							onClick={() => void call.toggleMicrophone()}
						>
							{call.isAudioOn ? <MicIcon /> : <MicOffIcon />}
							{call.isAudioOn ? "Microphone on" : "Microphone off"}
						</Button>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant={call.isAudioOn ? "default" : "outline"}
									size={controlSize}
									aria-label={`${call.isAudioOn ? "Microphone on" : "Microphone off"} more actions`}
								>
									<ChevronDownIcon />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								{microphoneActions.map((action) => (
									<DropdownMenuItem
										key={action.label}
										disabled={action.disabled}
										onSelect={action.onSelect}
									>
										{action.label}
									</DropdownMenuItem>
								))}
							</DropdownMenuContent>
						</DropdownMenu>
					</ButtonGroup>
					<ButtonGroup>
						<Button
							variant={call.isVideoOn ? "default" : "outline"}
							size={controlSize}
							onClick={() => void call.setCameraOn(!call.isVideoOn)}
						>
							{call.isVideoOn ? <VideoIcon /> : <VideoOffIcon />}
							{call.isVideoOn ? "Camera on" : "Camera off"}
						</Button>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant={call.isVideoOn ? "default" : "outline"}
									size={controlSize}
									aria-label={`${call.isVideoOn ? "Camera on" : "Camera off"} more actions`}
								>
									<ChevronDownIcon />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								{cameraActions.map((action) => (
									<DropdownMenuItem
										key={action.label}
										disabled={action.disabled}
										onSelect={action.onSelect}
									>
										{action.icon}
										{action.label}
									</DropdownMenuItem>
								))}
							</DropdownMenuContent>
						</DropdownMenu>
					</ButtonGroup>
					<Button
						size={controlSize}
						variant={call.isScreensharing ? "default" : "outline"}
						disabled={call.screensharePending}
						aria-busy={call.screensharePending || undefined}
						onClick={() => void call.toggleScreenshare()}
					>
						{call.screensharePending ? (
							<Spinner />
						) : call.isScreensharing ? (
							<MonitorDot />
						) : (
							<MonitorOff />
						)}
						{call.isScreensharing ? "Screen sharing on" : "Screen sharing off"}
					</Button>
					{canRecord && (
						<Button
							size={controlSize}
							variant={call.isRecording ? "default" : "outline"}
							disabled={call.recordingPending}
							aria-busy={call.recordingPending || undefined}
							onClick={() => void call.toggleRecording()}
						>
							{call.recordingPending ? (
								<Spinner />
							) : call.isRecording ? (
								<CctvIcon />
							) : (
								<CctvOffIcon />
							)}
							{call.isRecording ? "Recording on" : "Recording off"}
						</Button>
					)}
					<ButtonGroup>
						<Button
							variant="outline"
							size={controlSize}
							onClick={() => setDrawer("chat")}
						>
							<MessageSquareIcon />
							Chat
						</Button>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="outline"
									size={controlSize}
									aria-label="Chat more actions"
								>
									<ChevronDownIcon />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem onSelect={() => setDrawer("participants")}>
									<UsersIcon />
									Participants
								</DropdownMenuItem>
								{hasDetails && (
									<DropdownMenuItem onSelect={() => setDrawer("details")}>
										<InfoIcon />
										Meeting details
									</DropdownMenuItem>
								)}
								<DropdownMenuItem onSelect={() => setFeedbackOpen(true)}>
									<MessageSquarePlusIcon />
									Send feedback
								</DropdownMenuItem>
								<DropdownMenuItem onSelect={themeAction.onSelect}>
									{themeAction.icon}
									{themeAction.label}
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</ButtonGroup>
					<ChatDrawer
						open={drawer === "chat"}
						onOpenChange={(open) => setDrawer(open ? "chat" : null)}
					/>
					<FeedbackDialog
						open={feedbackOpen}
						onOpenChange={setFeedbackOpen}
						type="media"
						reference={call.slotId ? `slot:${call.slotId}` : undefined}
					/>
					{canEndMeeting && (
						<Dialog>
							<DialogTrigger asChild>
								<Button size={controlSize} variant="destructive">
									<PhoneOffIcon />
									End for all
								</Button>
							</DialogTrigger>
							<DialogContent>
								<DialogHeader>
									<DialogTitle>End meeting for all?</DialogTitle>
									<DialogDescription>
										Everyone will be disconnected immediately. This cannot be
										undone.
									</DialogDescription>
								</DialogHeader>
								<DialogFooter>
									<DialogClose asChild>
										<Button variant="outline">Cancel</Button>
									</DialogClose>
									<Button
										variant="destructive"
										onClick={() => void call.endMeeting()}
									>
										End meeting
									</Button>
								</DialogFooter>
							</DialogContent>
						</Dialog>
					)}
					<Dialog>
						<DialogTrigger asChild>
							<Button size={controlSize} variant="destructive">
								<LogOutIcon />
								Leave
							</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Leave the meeting?</DialogTitle>
								<DialogDescription>
									You can rejoin while the meeting is still live.
								</DialogDescription>
							</DialogHeader>
							<DialogFooter>
								<DialogClose asChild>
									<Button variant="outline">Stay</Button>
								</DialogClose>
								<Button
									variant="destructive"
									onClick={() => void call.leaveMeeting()}
								>
									Leave
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</div>

				<ParticipantsDrawer
					open={drawer === "participants"}
					onOpenChange={(open) => setDrawer(open ? "participants" : null)}
				/>

				<QuizPopup />

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
