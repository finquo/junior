"use client";

import type { Participant } from "@zoom/videosdk";
import ZoomVideo from "@zoom/videosdk";
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
	EllipsisIcon,
	InfoIcon,
	LogOutIcon,
	MicIcon,
	MicOffIcon,
	MonitorSmartphoneIcon,
	PhoneOffIcon,
	PinIcon,
	ScreenShareIcon,
	ScreenShareOffIcon,
	UserRoundIcon,
	UsersIcon,
	UserXIcon,
	VideoIcon,
	VideoOffIcon,
} from "lucide-react";
import { useState } from "react";
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
	CardContent,
	CardDescription,
	CardFooter,
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
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemGroup,
	ItemMedia,
	ItemTitle,
} from "@/components/ui/item";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/auth";
import { RenderWhenRole } from "@/hooks/role";
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
		<Frame className={cn("overflow-hidden", className)}>
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

function JoinPreference({
	icon,
	label,
	description,
	id,
	checked,
	disabled,
	onCheckedChange,
}: {
	icon: React.ReactNode;
	label: string;
	description: string;
	id: string;
	checked: boolean;
	disabled?: boolean;
	onCheckedChange: (checked: boolean) => void;
}) {
	return (
		<Item variant="muted" size="sm">
			<ItemMedia variant="icon">{icon}</ItemMedia>
			<ItemContent>
				<ItemTitle>{label}</ItemTitle>
				<ItemDescription>{description}</ItemDescription>
			</ItemContent>
			<ItemActions>
				<Switch
					id={id}
					aria-label={label}
					checked={checked}
					disabled={disabled}
					onCheckedChange={onCheckedChange}
				/>
			</ItemActions>
		</Item>
	);
}

export function VideoChat({
	session,
	token,
	slotId,
	onEnd,
}: {
	session: string;
	token: string;
	slotId?: string;
	onEnd?: () => void;
}) {
	const { data: user, isPending } = useAuth();
	const [guestName, setGuestName] = useState("");
	const [joinVideo, setJoinVideo] = useState(true);
	const [joinAudio, setJoinAudio] = useState(true);
	const [companion, setCompanion] = useState(false);
	const [inCall, setInCall] = useState(false);

	if (isPending) return <Loader />;

	const authName = user?.name?.trim();
	const userName = authName || guestName.trim();
	const needsName = !authName;
	const canJoinAsCompanion = user?.role === "teacher";

	const handleCompanion = (checked: boolean) => {
		setCompanion(checked);
		if (checked) {
			setJoinVideo(false);
			setJoinAudio(false);
		}
	};

	if (!inCall) {
		return (
			<Frame className="h-full min-h-0 rounded-none">
				<FramePanel className="grid h-full min-h-0 place-items-center overflow-hidden">
					<Card className="w-full max-w-md">
						<CardHeader>
							<CardTitle>Ready to join?</CardTitle>
							<CardDescription>
								Your camera and microphone will start after you join.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<ItemGroup className="gap-2">
								{needsName ? (
									<Field>
										<FieldLabel htmlFor="guest-name">Your name</FieldLabel>
										<Input
											id="guest-name"
											value={guestName}
											onChange={(event) => setGuestName(event.target.value)}
											placeholder="Enter your name"
											autoComplete="name"
										/>
									</Field>
								) : (
									<Item variant="muted">
										<ItemMedia variant="icon">
											<UserRoundIcon />
										</ItemMedia>
										<ItemContent>
											<ItemDescription>Joining as</ItemDescription>
											<ItemTitle>{authName}</ItemTitle>
										</ItemContent>
									</Item>
								)}

								<JoinPreference
									id="join-video"
									icon={<VideoIcon />}
									label="Camera"
									description={joinVideo ? "On" : "Off"}
									checked={joinVideo}
									disabled={companion}
									onCheckedChange={setJoinVideo}
								/>
								<JoinPreference
									id="join-audio"
									icon={<MicIcon />}
									label="Microphone"
									description={joinAudio ? "On" : "Off"}
									checked={joinAudio}
									disabled={companion}
									onCheckedChange={setJoinAudio}
								/>

								{canJoinAsCompanion && (
									<JoinPreference
										id="join-companion"
										icon={<MonitorSmartphoneIcon />}
										label="Join as companion"
										description="Join without camera or microphone, then share your screen from this device."
										checked={companion}
										onCheckedChange={handleCompanion}
									/>
								)}
							</ItemGroup>
						</CardContent>
						<CardFooter>
							<Button disabled={!userName} onClick={() => setInCall(true)}>
								<VideoIcon />
								Join session
							</Button>
						</CardFooter>
					</Card>
				</FramePanel>
			</Frame>
		);
	}

	return (
		<Session
			session={session}
			token={token}
			userName={userName}
			slotId={slotId}
			canViewDetails={Boolean(user)}
			disableVideo={!joinVideo}
			disableAudio={!joinAudio}
			onLeave={() => setInCall(false)}
			onEnd={onEnd}
		/>
	);
}

function Session({
	session,
	token,
	userName,
	slotId,
	canViewDetails,
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
	const { isAudioMuted, toggleMute } = useAudioState();
	const { ScreenshareRef, startScreenshare, stopScreenshare, isScreensharing } =
		useScreenshare();
	const screenShareUsers = useScreenShareUsers();

	// A participant list containing ourselves means the join is already live,
	// even if startAudio/startVideo are still resolving.
	const connected = isInSession || participants.length > 0;

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

	const isSharing = isScreensharing || screenShareUsers.length > 0;

	const endMeeting = async () => {
		await ZoomVideo.createClient().leave(true);
		if (onEnd) onEnd();
		else onLeave();
	};

	const toggleScreenshare = () => {
		if (isScreensharing) void stopScreenshare();
		else startScreenshare();
	};

	return (
		<Frame className="h-full min-h-0 rounded-none p-2">
			<FramePanel
				className={cn(
					"relative grid h-full min-h-0 content-center gap-2 overflow-hidden",
					isSharing
						? "grid-cols-1"
						: others.length > 1
							? "grid-cols-2"
							: "grid-cols-1",
				)}
			>
				{/* Kept mounted so the SDK always has a share surface to draw into. */}
				<div
					className={cn(
						"call-screenshare col-span-full",
						isScreensharing ? "h-full w-full" : "hidden",
					)}
				>
					<LocalScreenShareComponent ref={ScreenshareRef} />
				</div>

				{!isScreensharing && screenShareUsers.length > 0 && (
					<Frame className="col-span-full h-full min-h-0 overflow-hidden">
						<ScreenShareContainerComponent className="call-screenshare-remote h-full w-full">
							{screenShareUsers.map((userId) => (
								<ScreenSharePlayerComponent key={userId} userId={userId} />
							))}
						</ScreenShareContainerComponent>
					</Frame>
				)}

				{!isSharing &&
					others.map((participant) => (
						<VideoTile key={participant.userId} user={participant} menu />
					))}

				{myself && (
					<div className="absolute right-4 bottom-4 z-10">
						<VideoTile
							user={myself}
							voiceOn={!isAudioMuted}
							className="aspect-video min-w-64 shadow-lg"
						/>
					</div>
				)}

				<div className="absolute bottom-4 left-4 z-10">
					<Frame className="shadow-lg">
						<ButtonGroup>
							<Button
								variant="outline"
								size="icon-lg"
								onClick={() => void toggleMute()}
								aria-label={isAudioMuted ? "Unmute" : "Mute"}
							>
								{isAudioMuted ? <MicOffIcon /> : <MicIcon />}
							</Button>
							<Button
								variant="outline"
								size="icon-lg"
								onClick={() => void toggleVideo()}
								aria-label={isVideoOn ? "Turn off camera" : "Turn on camera"}
							>
								{isVideoOn ? <VideoIcon /> : <VideoOffIcon />}
							</Button>
							<Button
								variant={isScreensharing ? "default" : "outline"}
								size="icon-lg"
								onClick={toggleScreenshare}
								aria-label={
									isScreensharing ? "Stop sharing screen" : "Share screen"
								}
							>
								{isScreensharing ? <ScreenShareOffIcon /> : <ScreenShareIcon />}
							</Button>
							<ParticipantsDrawer participants={participants}>
								<Button
									variant="outline"
									size="icon-lg"
									aria-label="Show participants"
								>
									<UsersIcon />
								</Button>
							</ParticipantsDrawer>
							{slotId && canViewDetails && (
								<MeetingDetails slotId={slotId}>
									<Button
										variant="outline"
										size="icon-lg"
										aria-label="Show meeting details"
									>
										<InfoIcon />
									</Button>
								</MeetingDetails>
							)}
							<RenderWhenRole role={["admin", "scheduler", "teacher"]}>
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
							</RenderWhenRole>
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
