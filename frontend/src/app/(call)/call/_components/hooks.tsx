"use client";

import { useMutation } from "@tanstack/react-query";
import ZoomVideo, { ConnectionState, RecordingStatus } from "@zoom/videosdk";
import {
	useAudioState,
	useMyself,
	useScreenShareUsers,
	useScreenshare,
	useSession,
	useSessionUsers,
	useVideoState,
} from "@zoom/videosdk-react";
import { MessageSquareDotIcon, MessagesSquareIcon } from "lucide-react";
import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";
import { sileo as toast } from "sileo";
import { Toaster as SonnerToaster, toast as sonnerToast } from "sonner";
import { api } from "@/hooks/api";
import { useJoinPreferences } from "./call-preferences";
import { parseQuizAnswerMessage, parseQuizMessage } from "./quiz-message";
import { sdkErrorDescription, VIRTUAL_BACKGROUND } from "./utils";

type ZoomClient = ReturnType<typeof ZoomVideo.createClient>;

export type ChatMessage = {
	id: string;
	senderId: string;
	senderName: string;
	text: string;
};

type CallSetup = {
	session: string;
	token: string;
	userName: string;
	slotId?: string;
	role: string;
	disableVideo: boolean;
	disableAudio: boolean;
	virtualBackground: boolean;
	cameraId: string | null;
	microphoneId: string | null;
	speakerId: string | null;
	onLeave: () => void;
	onEnd?: () => void;
};

function useChat(
	client: ZoomClient,
	connected: boolean,
	myself: ReturnType<typeof useMyself>,
	userName: string,
) {
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [unread, setUnread] = useState(0);
	const myUserId = myself?.userId;

	useEffect(() => {
		if (!connected) return;

		setMessages(
			client
				.getChatClient()
				.getHistory()
				.map((item) => ({
					id: crypto.randomUUID(),
					senderId: item.sender.userId.toString(),
					senderName: item.sender.name,
					text: item.message ?? "",
				})),
		);
	}, [client, connected]);

	useEffect(() => {
		if (!connected) return;

		function handleChatMessage(payload: {
			message: string;
			sender: { userId: number; name: string };
		}) {
			if (payload.sender.userId === myUserId) return;

			setMessages((previous) => [
				...previous,
				{
					id: crypto.randomUUID(),
					senderId: payload.sender.userId.toString(),
					senderName: payload.sender.name,
					text: payload.message,
				},
			]);

			const quiz = parseQuizMessage(payload.message);
			const answer = parseQuizAnswerMessage(payload.message);

			sonnerToast.info(payload.sender.name, {
				icon: <MessageSquareDotIcon />,
				description: quiz
					? "sent a quiz"
					: answer
						? "submitted quiz answers"
						: payload.message,
			});

			setUnread((count) => count + 1);
		}

		client.on("chat-on-message", handleChatMessage);

		return () => {
			client.off("chat-on-message", handleChatMessage);
		};
	}, [client, connected, myUserId]);

	const sendChat = (text: string) => {
		void client.getChatClient().sendToAll(text);
		setMessages((previous) => [
			...previous,
			{
				id: crypto.randomUUID(),
				senderId: myUserId?.toString() ?? "",
				senderName: myself?.displayName ?? userName,
				text,
			},
		]);
	};

	const markChatRead = () => setUnread(0);

	return { messages, unread, markChatRead, sendChat };
}

function useRecording(client: ZoomClient, connected: boolean) {
	const [status, setStatus] = useState(RecordingStatus.Stopped);
	const [pending, setPending] = useState(false);
	const isRecording =
		status === RecordingStatus.Recording || status === RecordingStatus.Paused;

	useEffect(() => {
		if (!connected) return;

		try {
			const recording = client.getRecordingClient();

			function handleRecordingChange(next: RecordingStatus) {
				setStatus(next);
			}

			setStatus(recording.getCloudRecordingStatus());
			client.on("recording-change", handleRecordingChange);

			return () => {
				client.off("recording-change", handleRecordingChange);
			};
		} catch {
			return;
		}
	}, [client, connected]);

	const toggleRecording = async () => {
		if (pending) return;

		setPending(true);

		try {
			const recording = client.getRecordingClient();
			const current = recording.getCloudRecordingStatus();

			if (isRecording) {
				if (current === RecordingStatus.Stopped) {
					setStatus(RecordingStatus.Stopped);
					return;
				}

				const result = await recording.stopCloudRecording();
				if (result instanceof Error) throw result;

				setStatus(RecordingStatus.Stopped);
				toast.info({ title: "Recording stopped" });
				return;
			}

			if (
				current === RecordingStatus.Recording ||
				current === RecordingStatus.Paused
			) {
				setStatus(current);
				return;
			}

			const result = await recording.startCloudRecording();
			if (result instanceof Error) throw result;

			setStatus(RecordingStatus.Recording);
			toast.success({ title: "Recording started" });
		} catch (error) {
			toast.error({
				title: isRecording
					? "Could not stop recording"
					: "Could not start recording",
				description: sdkErrorDescription(error),
			});
		} finally {
			setPending(false);
		}
	};

	return { isRecording, recordingPending: pending, toggleRecording };
}

function useMicrophone(client: ZoomClient) {
	const { isAudioMuted, isCapturingAudio } = useAudioState();
	const { setMic } = useJoinPreferences();
	const [pending, setPending] = useState(false);
	const isAudioOn = isCapturingAudio && !isAudioMuted;

	const toggleMicrophone = async () => {
		if (pending) return;

		setPending(true);

		const stream = client.getMediaStream();

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
			setPending(false);
		}
	};

	return {
		isAudioOn,
		isCapturingAudio,
		audioPending: pending,
		toggleMicrophone,
	};
}

function useCamera(
	client: ZoomClient,
	connected: boolean,
	isInSession: boolean,
	virtualBackground: boolean,
) {
	const { isVideoOn } = useVideoState();
	const { setCamera } = useJoinPreferences();
	const [backgroundEnabled, setBackgroundEnabled] = useState(virtualBackground);
	const [cameraPending, setCameraPending] = useState(false);
	const backgroundSupported =
		isInSession && client.getMediaStream().isSupportVirtualBackground();

	useEffect(() => {
		if (!connected || !isVideoOn || !backgroundEnabled) return;

		client
			.getMediaStream()
			.updateVirtualBackgroundImage(VIRTUAL_BACKGROUND)
			.catch((error: unknown) =>
				toast.error({
					title: "Could not apply virtual background",
					description: sdkErrorDescription(error),
				}),
			);
	}, [client, connected, isVideoOn, backgroundEnabled]);

	const setCameraOn = async (next: boolean) => {
		if (cameraPending) return;

		setCameraPending(true);

		const stream = client.getMediaStream();

		try {
			if (next) {
				await stream.startVideo(
					backgroundEnabled
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
		} finally {
			setCameraPending(false);
		}

		void setCamera(next);
		if (next) toast.success({ title: "Camera on" });
		else toast.info({ title: "Camera off" });
	};

	const flipCamera = async () => {
		const stream = client.getMediaStream();
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
			if (next && !isVideoOn) {
				// Turning the background on with the camera off starts both together.
				await client
					.getMediaStream()
					.startVideo({ virtualBackground: { imageUrl: VIRTUAL_BACKGROUND } });
				void setCamera(true);
				setBackgroundEnabled(true);
				toast.success({ title: "Camera on" });
				return;
			}

			await client
				.getMediaStream()
				.updateVirtualBackgroundImage(next ? VIRTUAL_BACKGROUND : undefined);
		} catch (error) {
			toast.error({
				title: "Could not change background",
				description: sdkErrorDescription(error),
			});
			return;
		}

		setBackgroundEnabled(next);
	};

	return {
		isVideoOn,
		cameraPending,
		backgroundEnabled,
		backgroundSupported,
		setCameraOn,
		flipCamera,
		setVirtualBackgroundOn,
	};
}

function useScreenshareControl() {
	const { ScreenshareRef, startScreenshare, stopScreenshare, isScreensharing } =
		useScreenshare();

	const [screensharePending, setScreensharePending] = useState(false);

	// startScreenshare only opens the picker, so pending stays until the
	// share actually starts (or the fallback timeout clears it on cancel).
	useEffect(() => {
		if (isScreensharing && screensharePending) {
			setScreensharePending(false);
		}
	}, [isScreensharing, screensharePending]);

	const toggleScreenshare = async () => {
		if (screensharePending) return;

		if (isScreensharing) {
			setScreensharePending(true);

			try {
				await stopScreenshare();
				toast.info({ title: "Screen sharing stopped" });
			} catch {
				toast.error({ title: "Could not stop screen sharing" });
			} finally {
				setScreensharePending(false);
			}
			return;
		}

		setScreensharePending(true);

		try {
			startScreenshare();
			window.setTimeout(() => setScreensharePending(false), 60_000);
		} catch {
			toast.error({ title: "Could not start screen sharing" });
			setScreensharePending(false);
		}
	};

	return {
		ScreenshareRef,
		isScreensharing,
		screensharePending,
		stopScreenshare,
		toggleScreenshare,
	};
}

function useMicLevel(connected: boolean, active: boolean) {
	const [level, setLevel] = useState(0);

	useEffect(() => {
		if (!connected || !active) {
			setLevel(0);
			return;
		}

		let stream: MediaStream | null = null;
		let context: AudioContext | null = null;
		let frame = 0;
		let cancelled = false;

		navigator.mediaDevices
			.getUserMedia({ audio: true })
			.then((microphone) => {
				if (cancelled) {
					microphone.getTracks().forEach((track) => {
						track.stop();
					});
					return;
				}

				stream = microphone;
				context = new AudioContext();
				const source = context.createMediaStreamSource(microphone);
				const analyser = context.createAnalyser();
				analyser.fftSize = 512;
				source.connect(analyser);

				const data = new Uint8Array(analyser.frequencyBinCount);
				let previous = 0;

				const tick = () => {
					analyser.getByteTimeDomainData(data);

					let sum = 0;
					for (const value of data) {
						const wave = (value - 128) / 128;
						sum += wave * wave;
					}
					const level = Math.sqrt(sum / data.length);

					// Quantise, so consumers re-render only on visible change.
					if (Math.abs(level - previous) > 0.015) {
						previous = level;
						setLevel(Math.min(1, level * 8));
					}

					frame = requestAnimationFrame(tick);
				};
				tick();
			})
			.catch(() => undefined);

		return () => {
			cancelled = true;
			cancelAnimationFrame(frame);
			stream?.getTracks().forEach((track) => {
				track.stop();
			});
			void context?.close();
		};
	}, [connected, active]);

	return level;
}

function useModeration(client: ZoomClient) {
	const [pinnedUserId, setPinnedUserId] = useState<number | null>(null);

	const togglePin = (userId: number) => {
		setPinnedUserId((current) => (current === userId ? null : userId));
	};

	const muteParticipant = async (userId: number) => {
		try {
			const result = await client.getMediaStream().muteAudio(userId);
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
			const result = await client.removeUser(userId);
			if (result) throw result;
			toast.info({ title: "Participant removed" });
		} catch (error) {
			toast.error({
				title: "Could not remove participant",
				description: sdkErrorDescription(error),
			});
		}
	};

	return {
		pinnedUserId,
		togglePin,
		muteParticipant,
		removeParticipant,
	};
}

function useCallState({
	session,
	token,
	userName,
	slotId,
	role,
	disableVideo,
	disableAudio,
	virtualBackground,
	cameraId,
	microphoneId,
	speakerId,
	onLeave,
	onEnd,
}: CallSetup) {
	const [client] = useState(() => ZoomVideo.createClient());
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
	const participants = useSessionUsers();
	const myself = useMyself();
	const screenShareUsers = useScreenShareUsers();

	// A participant list containing ourselves means the join is already live,
	// even if startAudio/startVideo are still resolving.
	const connected = isInSession || participants.length > 0;
	const moderator = Boolean(myself?.isHost || myself?.isManager);

	const chat = useChat(client, connected, myself, userName);
	const recording = useRecording(client, connected);
	const microphone = useMicrophone(client);
	const camera = useCamera(client, connected, isInSession, virtualBackground);
	const screenshare = useScreenshareControl();
	const micLevel = useMicLevel(connected, microphone.isAudioOn);
	const moderation = useModeration(client);

	const endMeetingMutation = useMutation(
		api.meeting.end.mutationOptions({
			onError: (error) =>
				toast.error({
					title: "Could not mark meeting as ended",
					description: error.message,
				}),
		}),
	);

	useEffect(() => {
		function handleConnectionChange(payload: {
			state: ConnectionState;
			reason?: string;
		}) {
			if (
				payload.state === ConnectionState.Closed &&
				payload.reason === "ended by host"
			) {
				onEnd?.();
			}
		}

		client.on("connection-change", handleConnectionChange);

		return () => {
			client.off("connection-change", handleConnectionChange);
		};
	}, [client, onEnd]);

	const micDevices = connected
		? (() => {
				try {
					return client.getMediaStream().getMicList();
				} catch {
					return [];
				}
			})()
		: [];
	const cameraDevices = connected
		? (() => {
				try {
					return client.getMediaStream().getCameraList();
				} catch {
					return [];
				}
			})()
		: [];

	const switchMicrophone = async (deviceId: string) => {
		try {
			const result = await client.getMediaStream().switchMicrophone(deviceId);
			if (result) throw result;
			toast.success({ title: "Microphone switched" });
		} catch (error) {
			toast.error({
				title: "Could not switch microphone",
				description: sdkErrorDescription(error),
			});
		}
	};

	const switchCamera = async (deviceId: string) => {
		try {
			await client.getMediaStream().switchCamera(deviceId);
			toast.success({ title: "Camera switched" });
		} catch (error) {
			toast.error({
				title: "Could not switch camera",
				description: sdkErrorDescription(error),
			});
		}
	};

	const releaseMedia = async () => {
		const stream = client.getMediaStream();

		if (screenshare.isScreensharing)
			await screenshare.stopScreenshare().catch(() => undefined);
		if (camera.isVideoOn) await stream.stopVideo().catch(() => undefined);
		if (microphone.isCapturingAudio)
			await stream.stopAudio().catch(() => undefined);
	};

	const leaveMeeting = async () => {
		await releaseMedia();
		await client.leave();
		onLeave();
	};

	const endMeeting = async () => {
		if (slotId && ["admin", "scheduler"].includes(role)) {
			await endMeetingMutation
				.mutateAsync({ id: slotId })
				.catch(() => undefined);
		}

		await releaseMedia();
		await client.leave(true);
		if (onEnd) onEnd();
		else onLeave();
	};

	return {
		isError,
		error,
		isInSession,
		connected,
		slotId,
		role,
		participants,
		myself,
		moderator,
		screenShareUsers,
		...chat,
		...recording,
		...microphone,
		micLevel,
		...camera,
		...screenshare,
		...moderation,
		micDevices,
		cameraDevices,
		switchMicrophone,
		switchCamera,
		leaveMeeting,
		endMeeting,
	};
}

export function useDraggable() {
	const ref = useRef<HTMLDivElement>(null);
	const [position, setPosition] = useState<{
		left: number;
		top: number;
	} | null>(null);
	const drag = useRef<{
		x: number;
		y: number;
		origin: { left: number; top: number };
		width: number;
		height: number;
		bounds: DOMRect;
	} | null>(null);

	const onPointerDown = (event: React.PointerEvent<HTMLElement>) => {
		if (event.button !== 0) return;

		const node = ref.current;
		const parent = node?.offsetParent;
		if (!node || !(parent instanceof HTMLElement)) return;

		const rect = node.getBoundingClientRect();
		const bounds = parent.getBoundingClientRect();

		drag.current = {
			x: event.clientX,
			y: event.clientY,
			origin: { left: rect.left - bounds.left, top: rect.top - bounds.top },
			width: rect.width,
			height: rect.height,
			bounds,
		};
		event.currentTarget.setPointerCapture(event.pointerId);
	};

	const onPointerMove = (event: React.PointerEvent<HTMLElement>) => {
		const current = drag.current;
		if (!current) return;

		const left = current.origin.left + event.clientX - current.x;
		const top = current.origin.top + event.clientY - current.y;

		setPosition({
			left: Math.min(Math.max(left, 0), current.bounds.width - current.width),
			top: Math.min(Math.max(top, 0), current.bounds.height - current.height),
		});
	};

	const onPointerUp = () => {
		drag.current = null;
	};

	return {
		ref,
		position,
		handleProps: {
			onPointerDown,
			onPointerMove,
			onPointerUp,
			onPointerCancel: onPointerUp,
		},
	};
}

type CallValue = ReturnType<typeof useCallState>;

const CallContext = createContext<CallValue | null>(null);

export function CallProvider({
	children,
	...setup
}: CallSetup & { children: ReactNode }) {
	const value = useCallState(setup);

	return (
		<CallContext.Provider value={value}>
			{children}
			<SonnerToaster position="bottom-left" />
		</CallContext.Provider>
	);
}

export function useCall() {
	const value = useContext(CallContext);

	if (!value) throw new Error("useCall must be used inside CallProvider");

	return value;
}
