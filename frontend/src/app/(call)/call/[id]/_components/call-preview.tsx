"use client";

import ZoomVideo, {
	type LocalAudioTrack,
	type LocalVideoTrack,
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
			<SelectTrigger id={id} aria-label={label} className="basis-full">
				<SelectValue />
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
	const testerRef =
		useRef<ReturnType<LocalAudioTrack["testMicrophone"]>>(undefined);
	const track = preview.audioTrack;

	useEffect(() => {
		return () => {
			testerRef.current?.destroy();
		};
	}, []);

	const reset = () => {
		testerRef.current?.destroy();
		testerRef.current = undefined;
		setState("idle");
		setTestLevel(0);
	};

	const onClick = () => {
		if (!track) return;

		if (state !== "idle") {
			testerRef.current?.stopRecording();
			reset();
			return;
		}

		testerRef.current = track.testMicrophone({
			speakerId: preview.speakerId ?? undefined,
			recordAndPlay: true,
			onAnalyseFrequency: setTestLevel,
			onStartRecording: () => setState("recording"),
			onStartPlayRecording: () => setState("playing"),
			onStopPlayRecording: reset,
		});
	};

	const level = state === "idle" ? preview.micLevel : testLevel;

	return (
		<Item variant="outline">
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
	const track = preview.audioTrack;

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
		<Item variant="outline">
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
	const videoRef = useRef<HTMLVideoElement | null>(null);
	const videoTrackRef = useRef<LocalVideoTrack | undefined>(undefined);

	useEffect(() => {
		let cancelled = false;

		const refreshDevices = async () => {
			try {
				setDevices(await ZoomVideo.getDevices());
			} catch (error) {
				toast.error({
					title: "Could not list devices",
					description: sdkErrorDescription(error),
				});
			}
		};

		const init = async () => {
			try {
				await ZoomVideo.createClient().init("en-US", "Global", {
					patchJsMedia: true,
				});
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

		if (!loaded || !camera || !player) return;

		const track = ZoomVideo.createLocalVideoTrack(
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
		if (!loaded || !mic) {
			setAudioTrack(undefined);
			setMicLevel(0);
			return;
		}

		const track = ZoomVideo.createLocalAudioTrack(
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
					<video
						ref={preview.videoRef}
						muted
						playsInline
						className="size-full object-cover"
						style={{ transform: "scaleX(-1)" }}
					/>
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
