"use client";

import type ZoomVideoSDK from "@zoom/videosdk";
import type {
	LocalAudioTrack,
	LocalVideoTrack,
	VideoPlayer,
} from "@zoom/videosdk";
import { MicIcon, VideoOffIcon, Volume2Icon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { sileo as toast } from "sileo";
import { Frame } from "@/components/reui/frame";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import {
	Item,
	ItemActions,
	ItemContent,
	ItemMedia,
	ItemTitle,
} from "@/components/ui/item";
import { Progress } from "@/components/ui/progress";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useJoinPreferences } from "../../_components/call-preferences";
import {
	sdkErrorDescription,
	VIRTUAL_BACKGROUND,
} from "../../_components/utils";

const DEFAULT_DEVICE = "default";
const LEVEL_POLL_MS = 100;
const SPEAKER_TEST_MS = 5000;
const MAX_RECORD_MS = 10_000;

// The SDK registers the video-player web components; React 19 needs the
// intrinsic elements declared to render them.
declare module "react" {
	namespace JSX {
		interface IntrinsicElements {
			"video-player": React.DetailedHTMLProps<
				React.HTMLAttributes<HTMLElement>,
				HTMLElement
			>;
			"video-player-container": React.DetailedHTMLProps<
				React.HTMLAttributes<HTMLElement>,
				HTMLElement
			>;
		}
	}
}

type DeviceList = Array<{ label: string; deviceId: string }>;

const isMobileBrowser = () =>
	/iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

function listDevices(
	devices: MediaDeviceInfo[],
	kind: MediaDeviceKind,
	fallback: string,
): DeviceList {
	return devices
		.filter((device) => device.kind === kind)
		.map((device, index) => ({
			label: device.label || `${fallback} ${index + 1}`,
			deviceId: device.deviceId,
		}));
}

function cameraList(devices: MediaDeviceInfo[]): DeviceList {
	const cameras = listDevices(devices, "videoinput", "Camera");

	if (isMobileBrowser() && cameras.length > 0) {
		return [
			{ label: "Front camera", deviceId: "user" },
			{ label: "Back camera", deviceId: "environment" },
		];
	}

	return cameras;
}

function DeviceSelect({
	id,
	label,
	items,
	value,
	onValueChange,
}: {
	id: string;
	label: string;
	items: DeviceList;
	value: string;
	onValueChange: (value: string) => void;
}) {
	return (
		<Select value={value} onValueChange={onValueChange}>
			<SelectTrigger
				id={id}
				aria-label={label}
				className="w-full min-w-0 basis-full"
			>
				<SelectValue className="min-w-0 truncate" />
			</SelectTrigger>
			<SelectContent>
				<SelectGroup>
					<SelectItem value={DEFAULT_DEVICE}>System default</SelectItem>
					{items.map((item) => (
						<SelectItem key={item.deviceId} value={item.deviceId}>
							{item.label}
						</SelectItem>
					))}
				</SelectGroup>
			</SelectContent>
		</Select>
	);
}

function MicrophoneItem({ preview }: { preview: CallPreviewState }) {
	const [state, setState] = useState<"idle" | "recording" | "playing">("idle");
	const [testLevel, setTestLevel] = useState(0);
	const streamRef = useRef<MediaStream | undefined>(undefined);
	const recorderRef = useRef<MediaRecorder | undefined>(undefined);
	const playerRef = useRef<HTMLAudioElement | undefined>(undefined);
	const audioCtxRef = useRef<AudioContext | undefined>(undefined);
	const timerRef = useRef<number | undefined>(undefined);
	const pollRef = useRef<number | undefined>(undefined);
	const track = preview.audioTrack;

	const cleanup = useCallback(() => {
		window.clearTimeout(timerRef.current);
		window.clearInterval(pollRef.current);
		recorderRef.current = undefined;
		playerRef.current?.pause();
		playerRef.current = undefined;
		streamRef.current?.getTracks().forEach((streamTrack) => {
			streamTrack.stop();
		});
		streamRef.current = undefined;
		void audioCtxRef.current?.close();
		audioCtxRef.current = undefined;
		setTestLevel(0);
	}, []);

	useEffect(() => cleanup, [cleanup]);

	const reset = () => {
		cleanup();
		setState("idle");
	};

	// Plays the finished recording through the selected speaker (setSinkId on
	// the audio element; falls back to the system default when it fails).
	const playRecording = (blob: Blob) => {
		const player = new Audio(URL.createObjectURL(blob));
		playerRef.current = player;

		const finish = () => {
			reset();
		};

		player.onended = finish;
		player.onerror = () => {
			toast.error({ title: "Could not play the recording" });
			finish();
		};

		const speakerId = preview.speakerId;
		if (speakerId && "setSinkId" in player) {
			player.setSinkId(speakerId).catch(() => {
				// fall back to the system default output
			});
		}

		setState("playing");
		void player.play().catch(() => {
			toast.error({ title: "Could not play the recording" });
			finish();
		});
	};

	const startRecording = async () => {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				audio: preview.microphoneId
					? { deviceId: { exact: preview.microphoneId } }
					: true,
			});
			streamRef.current = stream;

			// Live level meter while recording, same slot the tester filled.
			const ctx = new AudioContext();
			audioCtxRef.current = ctx;
			const analyser = ctx.createAnalyser();
			ctx.createMediaStreamSource(stream).connect(analyser);
			const bins = new Uint8Array(analyser.frequencyBinCount);
			pollRef.current = window.setInterval(() => {
				analyser.getByteFrequencyData(bins);
				let sum = 0;
				for (const bin of bins) sum += bin;
				setTestLevel(Math.round(sum / bins.length));
			}, LEVEL_POLL_MS);

			const chunks: Blob[] = [];
			const recorder = new MediaRecorder(stream);
			recorderRef.current = recorder;
			recorder.ondataavailable = (event) => {
				if (event.data.size) chunks.push(event.data);
			};
			recorder.onstop = () => {
				window.clearInterval(pollRef.current);
				const blob = new Blob(chunks, { type: recorder.mimeType });
				if (!blob.size) {
					toast.error({ title: "Nothing was recorded" });
					reset();
					return;
				}
				playRecording(blob);
			};

			recorder.start();
			setState("recording");
			timerRef.current = window.setTimeout(() => {
				if (recorder.state !== "inactive") recorder.stop();
			}, MAX_RECORD_MS);
		} catch (error) {
			toast.error({
				title: "Could not record the microphone",
				description: sdkErrorDescription(error),
			});
			reset();
		}
	};

	const onClick = () => {
		if (state === "recording") {
			recorderRef.current?.stop();
			return;
		}

		if (state === "playing") {
			reset();
			return;
		}

		void startRecording();
	};

	const level = state === "idle" ? preview.micLevel : testLevel;

	return (
		<Item variant="outline" className="min-w-0">
			<ItemMedia variant="icon">
				<MicIcon />
			</ItemMedia>
			<ItemContent>
				<ItemTitle>Microphone</ItemTitle>
			</ItemContent>
			<ItemActions>
				<Button
					type="button"
					variant="outline"
					size="sm"
					disabled={!track}
					onClick={onClick}
				>
					{state === "idle"
						? "Record & Test"
						: state === "recording"
							? "Stop recording"
							: "Stop playback"}
				</Button>
			</ItemActions>
			<DeviceSelect
				id="preview-microphone"
				label="Microphone"
				items={preview.microphones}
				value={preview.microphoneId ?? DEFAULT_DEVICE}
				onValueChange={(value) =>
					preview.setMicrophoneId(value === DEFAULT_DEVICE ? null : value)
				}
			/>
			<Progress value={level} aria-label="Microphone level" />
		</Item>
	);
}

function SpeakerItem({ preview }: { preview: CallPreviewState }) {
	const [playing, setPlaying] = useState(false);
	const [level, setLevel] = useState(0);
	const testerRef =
		useRef<ReturnType<LocalAudioTrack["testSpeaker"]>>(undefined);
	const track = preview.speakerTrack;

	const stop = useCallback(() => {
		testerRef.current?.destroy();
		testerRef.current = undefined;
		setPlaying(false);
		setLevel(0);
	}, []);

	useEffect(() => {
		return () => {
			testerRef.current?.destroy();
		};
	}, []);

	useEffect(() => {
		if (!playing) return;

		const timeout = window.setTimeout(stop, SPEAKER_TEST_MS);

		return () => window.clearTimeout(timeout);
	}, [playing, stop]);

	const onClick = () => {
		if (!track) return;

		if (playing) {
			stop();
			return;
		}

		setPlaying(true);
		testerRef.current = track.testSpeaker({
			speakerId: preview.speakerId ?? undefined,
			onAnalyseFrequency: setLevel,
		});
	};

	return (
		<Item variant="outline" className="min-w-0">
			<ItemMedia variant="icon">
				<Volume2Icon />
			</ItemMedia>
			<ItemContent>
				<ItemTitle>Speaker</ItemTitle>
			</ItemContent>
			<ItemActions>
				<Button
					type="button"
					variant="outline"
					size="sm"
					disabled={!track}
					onClick={onClick}
				>
					{playing ? "Stop" : "Play test sound"}
				</Button>
			</ItemActions>
			<DeviceSelect
				id="preview-speaker"
				label="Speaker"
				items={preview.speakers}
				value={preview.speakerId ?? DEFAULT_DEVICE}
				onValueChange={(value) =>
					preview.setSpeakerId(value === DEFAULT_DEVICE ? null : value)
				}
			/>
			<Progress value={level} aria-label="Speaker test level" />
		</Item>
	);
}

export function useCallPreview() {
	const {
		camera,
		mic,
		virtualBackground,
		cameraId,
		microphoneId,
		speakerId,
		setCameraId,
		setMicrophoneId,
		setSpeakerId,
	} = useJoinPreferences();

	const [loaded, setLoaded] = useState(false);
	const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
	const [micLevel, setMicLevel] = useState(0);
	const [audioTrack, setAudioTrack] = useState<LocalAudioTrack | undefined>(
		undefined,
	);
	const [speakerTrack, setSpeakerTrack] = useState<LocalAudioTrack | undefined>(
		undefined,
	);
	const videoRef = useRef<VideoPlayer | null>(null);
	const videoTrackRef = useRef<LocalVideoTrack | undefined>(undefined);
	const zoomRef = useRef<typeof ZoomVideoSDK | undefined>(undefined);

	useEffect(() => {
		let cancelled = false;

		const refreshDevices = async () => {
			const zoom = zoomRef.current;
			if (!zoom) return;

			try {
				setDevices(await zoom.getDevices());
			} catch (error) {
				toast.error({
					title: "Could not list devices",
					description: sdkErrorDescription(error),
				});
			}
		};

		const init = async () => {
			try {
				const { default: ZoomVideo } = await import("@zoom/videosdk");
				await ZoomVideo.createClient().init("en-US", "Global", {
					patchJsMedia: true,
				});
				zoomRef.current = ZoomVideo;
			} catch (error) {
				toast.error({
					title: "Could not initialize preview",
					description: sdkErrorDescription(error),
				});
				return;
			}

			if (cancelled) return;

			setLoaded(true);
			void refreshDevices();
		};

		void init();
		navigator.mediaDevices?.addEventListener?.("devicechange", refreshDevices);

		return () => {
			cancelled = true;
			navigator.mediaDevices?.removeEventListener?.(
				"devicechange",
				refreshDevices,
			);
		};
	}, []);

	useEffect(() => {
		const player = videoRef.current;

		const zoom = zoomRef.current;
		if (!loaded || !camera || !player || !zoom) return;

		const track = zoom.createLocalVideoTrack(
			cameraId && cameraId !== DEFAULT_DEVICE ? cameraId : undefined,
		);
		videoTrackRef.current = track;

		const start = async () => {
			try {
				await track.start(
					player,
					virtualBackground ? { imageUrl: VIRTUAL_BACKGROUND } : undefined,
				);
			} catch (error) {
				if (virtualBackground) {
					try {
						await track.start(player);
						return;
					} catch {
						// fall through to the error toast
					}
				}

				toast.error({
					title: "Could not start camera preview",
					description: sdkErrorDescription(error),
				});
			}
		};

		void start();

		return () => {
			void track.stop();
			videoTrackRef.current = undefined;
		};
	}, [loaded, camera, cameraId, virtualBackground]);

	useEffect(() => {
		const zoom = zoomRef.current;
		if (!loaded || !zoom) return;

		const track = zoom.createLocalAudioTrack();
		setSpeakerTrack(track);

		return () => {
			void track.stop();
			setSpeakerTrack(undefined);
		};
	}, [loaded]);

	useEffect(() => {
		const zoom = zoomRef.current;
		if (!loaded || !mic || !zoom) {
			setAudioTrack(undefined);
			setMicLevel(0);
			return;
		}

		const track = zoom.createLocalAudioTrack(
			microphoneId && microphoneId !== DEFAULT_DEVICE
				? microphoneId
				: undefined,
		);
		setAudioTrack(track);

		const start = async () => {
			try {
				await track.start();
				await track.unmute();
			} catch (error) {
				toast.error({
					title: "Could not start microphone preview",
					description: sdkErrorDescription(error),
				});
			}
		};

		void start();

		const poll = window.setInterval(() => {
			setMicLevel(track.getCurrentVolume());
		}, LEVEL_POLL_MS);

		return () => {
			window.clearInterval(poll);
			void track.stop();
			setAudioTrack(undefined);
			setMicLevel(0);
		};
	}, [loaded, mic, microphoneId]);

	return {
		loaded,
		camera,
		cameraId,
		microphoneId,
		speakerId,
		setCameraId,
		setMicrophoneId,
		setSpeakerId,
		micLevel,
		audioTrack,
		speakerTrack,
		videoRef,
		cameras: cameraList(devices),
		microphones: listDevices(devices, "audioinput", "Microphone"),
		speakers: listDevices(devices, "audiooutput", "Speaker"),
	};
}

export type CallPreviewState = ReturnType<typeof useCallPreview>;

export function CallPreviewPanel({ preview }: { preview: CallPreviewState }) {
	if (!preview.loaded) return null;

	return (
		<FieldGroup className="gap-3">
			<Frame className="relative aspect-video overflow-hidden p-0">
				{preview.camera ? (
					<video-player-container
						className="size-full"
						style={{ transform: "scaleX(-1)" }}
					>
						<video-player
							ref={preview.videoRef}
							className="size-full object-cover"
						/>
					</video-player-container>
				) : (
					<div className="flex size-full items-center justify-center gap-3 bg-muted">
						<Avatar size="lg">
							<AvatarFallback>
								<VideoOffIcon />
							</AvatarFallback>
						</Avatar>
						<span className="text-muted-foreground text-sm">
							Camera preview is off
						</span>
					</div>
				)}
				{preview.camera && (
					<div className="absolute bottom-2 left-2">
						<DeviceSelect
							id="preview-camera"
							label="Camera"
							items={preview.cameras}
							value={preview.cameraId ?? DEFAULT_DEVICE}
							onValueChange={(value) =>
								preview.setCameraId(value === DEFAULT_DEVICE ? null : value)
							}
						/>
					</div>
				)}
			</Frame>
			<div className="flex flex-row gap-2">
				<MicrophoneItem preview={preview} />
				<SpeakerItem preview={preview} />
			</div>
		</FieldGroup>
	);
}
