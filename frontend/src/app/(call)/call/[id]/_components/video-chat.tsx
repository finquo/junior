"use client";

import {
	useAudioState,
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
import Loader from "@/components/loader";
import {
	Frame,
	FrameActions,
	FrameDescription,
	FrameHeader,
	FramePanel,
	FrameTitle,
} from "@/components/reui/frame";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

const videoPlayerStyle = {
	width: "100%",
	height: "70vh",
	borderRadius: "var(--radius-lg)",
	overflow: "hidden",
} as const;

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
			<Button onClick={() => setInCall(true)}>
				<VideoIcon />
				Join session
			</Button>
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
	const { isLoading, isError, isInSession, error } = useSession(
		session,
		token,
		userName,
	);
	const participants = useSessionUsers();
	const { isVideoOn, toggleVideo } = useVideoState();
	const { isAudioMuted, toggleMute } = useAudioState();

	if (isLoading) {
		return <Loader />;
	}

	if (isError) {
		return (
			<Alert variant="destructive">
				<AlertTitle>Unable to join the session</AlertTitle>
				<AlertDescription>{error?.reason}</AlertDescription>
			</Alert>
		);
	}

	return (
		<Frame>
			<FrameHeader>
				<FrameTitle>Session: {session}</FrameTitle>
				<FrameDescription>Live video session</FrameDescription>
				<FrameActions>
					<Button
						variant="outline"
						size="icon"
						onClick={() => void toggleMute()}
						aria-label={isAudioMuted ? "Unmute" : "Mute"}
					>
						{isAudioMuted ? <MicOffIcon /> : <MicIcon />}
					</Button>
					<Button
						variant="outline"
						size="icon"
						onClick={() => void toggleVideo()}
						aria-label={isVideoOn ? "Turn off camera" : "Turn on camera"}
					>
						{isVideoOn ? <VideoIcon /> : <VideoOffIcon />}
					</Button>
					<Button
						variant="destructive"
						size="icon"
						onClick={onLeave}
						aria-label="Leave session"
					>
						<PhoneOffIcon />
					</Button>
				</FrameActions>
			</FrameHeader>
			<FramePanel>
				{isInSession && (
					<VideoPlayerContainerComponent style={videoPlayerStyle}>
						{participants.map((participant) => (
							<VideoPlayerComponent
								key={participant.userId}
								user={participant}
							/>
						))}
					</VideoPlayerContainerComponent>
				)}
			</FramePanel>
		</Frame>
	);
}
