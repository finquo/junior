"use client";

import {
	useAudioState,
	useMyself,
	useSession,
	useSessionUsers,
	useVideoState,
	VideoPlayerComponent,
	VideoPlayerContainerComponent,
} from "@zoom/videosdk-react";
import {
	MicIcon,
	MicOffIcon,
	PhoneOffIcon,
	VideoIcon,
	VideoOffIcon,
} from "lucide-react";
import { useState } from "react";
import { ErrorAuthCardFooter } from "@/app/_components/login";
import { Container } from "@/components/container";
import Loader from "@/components/loader";
import { Frame, FramePanel } from "@/components/reui/frame";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
	Card,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Self floats separately, so the main grid tops out at three others.
const MAX_REMOTE_TILES = 3;

const videoTileStyle = {
	width: "100%",
	aspectRatio: "16 / 9",
	overflow: "hidden",
	borderRadius: "var(--radius-lg)",
} as const;

type SessionUser = ReturnType<typeof useSessionUsers>[number];

function VideoTile({
	user,
	className,
}: {
	user: SessionUser;
	className?: string;
}) {
	return (
		<Frame className={cn("overflow-hidden", className)}>
			<VideoPlayerContainerComponent style={videoTileStyle}>
				<VideoPlayerComponent user={user} />
			</VideoPlayerContainerComponent>
		</Frame>
	);
}

export function VideoChat({
	session,
	token,
}: {
	session: string;
	token: string;
}) {
	const [inCall, setInCall] = useState(false);

	if (!inCall) {
		return (
			<Frame className="rounded-none">
				<FramePanel className="grid min-h-[60vh] place-items-center">
					<Card className="w-full max-w-md">
						<CardHeader>
							<CardTitle>Ready to join?</CardTitle>
							<CardDescription>
								Your camera and microphone will start after you join.
							</CardDescription>
						</CardHeader>
						<CardFooter>
							<Button onClick={() => setInCall(true)}>
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
		<Session session={session} token={token} onLeave={() => setInCall(false)} />
	);
}

function Session({
	session,
	token,
	onLeave,
}: {
	session: string;
	token: string;
	onLeave: () => void;
}) {
	const [userName] = useState(() => `User-${Date.now().toString().slice(8)}`);
	const { isError, isInSession, error } = useSession(session, token, userName);
	const participants = useSessionUsers();
	const myself = useMyself();
	const { isVideoOn, toggleVideo } = useVideoState();
	const { isAudioMuted, toggleMute } = useAudioState();

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

	return (
		<Frame className="rounded-none p-2">
			<FramePanel
				className={cn(
					"grid min-h-[60vh] content-center gap-2",
					others.length > 1 ? "grid-cols-2" : "grid-cols-1",
				)}
			>
				{others.map((participant) => (
					<VideoTile key={participant.userId} user={participant} />
				))}
				{myself && (
					<div className="absolute right-4 bottom-4 z-10">
						<VideoTile
							user={myself}
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
								variant="destructive"
								size="icon-lg"
								onClick={onLeave}
								aria-label="Leave session"
							>
								<PhoneOffIcon />
							</Button>
						</ButtonGroup>
					</Frame>
				</div>
			</FramePanel>
		</Frame>
	);
}
