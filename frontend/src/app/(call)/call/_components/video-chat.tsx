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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
	ItemActions,
	ItemContent,
	ItemMedia,
	ItemTitle,
} from "@/components/ui/item";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { ChatDrawer } from "./chat-drawer";
import { CallProvider, useCall, useDraggable } from "./hooks";
import { MeetingDetails } from "./meeting-details";
import { ParticipantsDrawer } from "./participants-drawer";
import { MAX_REMOTE_TILES, type SessionUser } from "./utils";
import { VideoTile } from "./video-tile";

const activeClass =
	"!border-success !bg-success !text-success-foreground hover:!bg-success/90";

const splitClass =
	"[&>div]:!overflow-hidden [&>div]:!rounded-[var(--radius-control)] [&>div>button]:!min-h-[var(--control-height-lg)] [&>div>button]:!rounded-none [&>div>button]:!text-sm [&>div>button:first-child]:!min-w-0 [&>div>button:first-child]:!px-5";

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
						>
							<div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-200 ease-out group-hover:grid-rows-[1fr]">
								<div className="min-h-0 overflow-hidden opacity-0 transition-opacity duration-200 ease-out group-hover:opacity-100">
									<FieldGroup className="gap-1.5 p-1.5">
										<FieldLabel htmlFor="tile-microphone-switch">
											<Field className="h-10" orientation="horizontal">
												<ItemMedia variant="icon">
													{call.audioPending ? (
														<Spinner />
													) : call.isAudioOn ? (
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
														checked={call.isAudioOn}
														disabled={call.audioPending}
														onCheckedChange={() => call.toggleMicrophone()}
													/>
												</ItemActions>
											</Field>
										</FieldLabel>
										<FieldLabel htmlFor="tile-camera-switch">
											<Field className="h-10" orientation="horizontal">
												<ItemMedia variant="icon">
													{call.isVideoOn ? <VideoIcon /> : <VideoOffIcon />}
												</ItemMedia>
												<ItemContent>
													<ItemTitle>Camera</ItemTitle>
												</ItemContent>
												<ItemActions>
													<Switch
														id="tile-camera-switch"
														aria-label="Camera"
														checked={call.isVideoOn}
														onCheckedChange={(checked) =>
															void call.setCameraOn(checked)
														}
													/>
												</ItemActions>
											</Field>
										</FieldLabel>
										<FieldLabel htmlFor="tile-background-switch">
											<Field className="h-10" orientation="horizontal">
												<ItemMedia variant="icon">
													{call.backgroundEnabled ? (
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
														checked={call.backgroundEnabled}
														disabled={
															!call.isVideoOn || !call.backgroundSupported
														}
														onCheckedChange={(checked) =>
															void call.setVirtualBackgroundOn(checked)
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
														disabled={!call.isVideoOn}
														onClick={() => void call.flipCamera()}
													>
														<SwitchCameraIcon />
													</Button>
												</ItemActions>
											</Field>
										</FieldLabel>
									</FieldGroup>
									<Separator />
								</div>
							</div>
						</VideoTile>
					)}
				</div>

				<div
					className={cn(
						"absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 gap-2",
						splitClass,
					)}
				>
					<ArcButton
						size="lg"
						variant="secondary"
						loading={call.audioPending}
						className={call.isAudioOn ? activeClass : undefined}
						onClick={() => void call.toggleMicrophone()}
					>
						{call.isAudioOn ? <MicIcon /> : <MicOffIcon />}
						{call.isAudioOn ? "Microphone on" : "Microphone off"}
					</ArcButton>
					<ArcButton
						size="lg"
						variant="secondary"
						loading={call.cameraPending}
						className={call.isVideoOn ? activeClass : undefined}
						onClick={() => void call.setCameraOn(!call.isVideoOn)}
					>
						{call.isVideoOn ? <VideoIcon /> : <VideoOffIcon />}
						{call.isVideoOn ? "Camera on" : "Camera off"}
					</ArcButton>
					<ArcButton
						size="lg"
						variant="secondary"
						loading={call.screensharePending}
						className={call.isScreensharing ? activeClass : undefined}
						onClick={() => void call.toggleScreenshare()}
					>
						{call.isScreensharing ? <MonitorDot /> : <MonitorOff />}
						{call.isScreensharing ? "Screen sharing on" : "Screen sharing off"}
					</ArcButton>
					{canRecord && (
						<ArcButton
							size="lg"
							variant="secondary"
							loading={call.recordingPending}
							className={call.isRecording ? activeClass : undefined}
							onClick={() => void call.toggleRecording()}
						>
							{call.isRecording ? <CctvIcon /> : <CctvOffIcon />}
							{call.isRecording ? "Recording on" : "Recording off"}
						</ArcButton>
					)}
					<ChatDrawer>
						<ArcButton size="lg" variant="secondary">
							<MessageSquareIcon />
							Chat
						</ArcButton>
					</ChatDrawer>
					{hasDetails && (
						<SplitButton
							label="Participants"
							icon={<UsersIcon />}
							variant="secondary"
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
