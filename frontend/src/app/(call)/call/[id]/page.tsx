"use client";

import { useQuery } from "@tanstack/react-query";
import {
	CalendarClockIcon,
	MicIcon,
	MicOffIcon,
	MonitorSmartphoneIcon,
	UserRoundIcon,
	VideoIcon,
	VideoOffIcon,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { sileo as toast } from "sileo";
import { Countdown } from "@/components/arc/countdown/countdown";
import Loader from "@/components/loader";
import { Frame, FramePanel } from "@/components/reui/frame";
import { ColorBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
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
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { api } from "@/hooks/api";
import { useAuth } from "@/hooks/auth";
import { getCallName, setCallName } from "../_components/call-name";
import { CallNotice } from "../_components/call-notice";
import { useJoinPreferences } from "../_components/call-preferences";

const JOIN_WINDOW_MS = 10 * 60 * 1000;

async function requestDevices(video: boolean, audio: boolean) {
	if (!navigator.mediaDevices?.getUserMedia) {
		toast.error({
			title: "This browser cannot access your camera or microphone",
		});
		return;
	}

	const requests: Promise<MediaStream>[] = [];
	if (video)
		requests.push(navigator.mediaDevices.getUserMedia({ video: true }));
	if (audio)
		requests.push(navigator.mediaDevices.getUserMedia({ audio: true }));

	const results = await Promise.allSettled(requests);
	let failed = false;

	for (const result of results) {
		if (result.status === "fulfilled") {
			for (const track of result.value.getTracks()) track.stop();
		} else {
			failed = true;
		}
	}

	if (failed) {
		toast.error({
			title: "Camera or microphone permission was not granted",
			description:
				"You can still join and allow access from the in-call controls.",
		});
	}
}

function formatDateTime(value: Date | string) {
	return new Date(value).toLocaleString([], {
		dateStyle: "medium",
		timeStyle: "short",
	});
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

function CallGate({ id }: { id: string }) {
	const router = useRouter();
	const { data: user, isPending } = useAuth();
	const { camera, setCamera, mic, setMic, companion, setCompanion } =
		useJoinPreferences();
	const [guestName, setGuestName] = useState("");
	const [joining, setJoining] = useState(false);

	const memberPreflight = useQuery(
		api.core.slot.join.queryOptions({
			input: { id },
			enabled: Boolean(user),
			refetchOnWindowFocus: false,
			refetchOnReconnect: false,
		}),
	);
	const guestPreflight = useQuery(
		api.meeting.join.queryOptions({
			input: { id },
			enabled: !isPending && !user,
			refetchOnWindowFocus: false,
			refetchOnReconnect: false,
		}),
	);
	const preflight = user ? memberPreflight : guestPreflight;

	useEffect(() => {
		if (preflight.data?.status !== "upcoming") return;

		const interval = setInterval(() => void preflight.refetch(), 30_000);
		return () => clearInterval(interval);
	}, [preflight.data?.status, preflight.refetch]);

	useEffect(() => {
		const stored = getCallName(id);
		if (stored) setGuestName(stored);
	}, [id]);

	if (isPending) return <Loader />;

	if (preflight.isPending) return <Loader />;

	if (preflight.isError || !preflight.data) {
		return (
			<Frame className="h-full min-h-0 rounded-none">
				<FramePanel className="grid h-full min-h-0 place-items-center overflow-hidden">
					<CallNotice
						status="error"
						error={preflight.error}
						onRefresh={preflight.refetch}
					/>
				</FramePanel>
			</Frame>
		);
	}

	const meeting = preflight.data;

	if (meeting.status === "not_found" || meeting.status === "ended") {
		return (
			<Frame className="h-full min-h-0 rounded-none">
				<FramePanel className="grid h-full min-h-0 place-items-center overflow-hidden">
					<CallNotice status={meeting.status} onRefresh={preflight.refetch} />
				</FramePanel>
			</Frame>
		);
	}

	const isLive = meeting.status === "live";
	const joinOpensAt = new Date(meeting.startTime).getTime() - JOIN_WINDOW_MS;

	const authName = user?.name?.trim();
	const userName = authName || guestName.trim();
	const needsName = !authName;
	const canJoinAsCompanion = user?.role === "teacher";
	const companionActive = canJoinAsCompanion && companion;

	const handleCompanion = (checked: boolean) => {
		setCompanion(checked);
		if (checked) {
			setCamera(false);
			setMic(false);
		}
	};

	const toggleCamera = () => {
		const next = !camera;
		setCamera(next);
		if (next) toast.success({ title: "Camera on" });
		else toast.info({ title: "Camera off" });
	};

	const toggleMic = () => {
		const next = !mic;
		setMic(next);
		if (next) toast.success({ title: "Microphone on" });
		else toast.info({ title: "Microphone off" });
	};

	const handleJoin = async () => {
		if (!userName) return;

		setJoining(true);
		try {
			const latest = await preflight.refetch();
			if (latest.data?.status !== "live") return;

			setCallName(id, userName);
			if (!companionActive) await requestDevices(camera, mic);

			const target = user ? "joined" : "guest";
			const search = window.location.search;
			router.push(`/call/${id}/${target}${search}` as "/");
		} finally {
			setJoining(false);
		}
	};

	return (
		<Frame className="h-full min-h-0 rounded-none">
			<FramePanel className="grid h-full min-h-0 place-items-center overflow-hidden">
				<Card className="w-full max-w-md">
					<CardHeader>
						<CardTitle>
							{isLive ? "Ready to join?" : "Waiting for the meeting"}
						</CardTitle>
						<CardDescription>
							{isLive
								? "We will ask for camera and microphone access when you join."
								: "Join opens 10 minutes before the scheduled start."}
						</CardDescription>
						<CardAction>
							<ColorBadge variant={isLive ? "success" : "info"}>
								{isLive ? "Live" : "Upcoming"}
							</ColorBadge>
						</CardAction>
					</CardHeader>
					<CardContent>
						<ItemGroup className="gap-2">
							<Item variant="muted" size="sm">
								<ItemMedia variant="icon">
									<CalendarClockIcon />
								</ItemMedia>
								<ItemContent>
									<ItemDescription>Scheduled</ItemDescription>
									<ItemTitle>
										{formatDateTime(meeting.startTime)} –{" "}
										{formatDateTime(meeting.endTime)}
									</ItemTitle>
								</ItemContent>
							</Item>

							{!isLive && (
								<Item variant="muted" size="sm">
									<ItemContent>
										<ItemDescription>Join opens in</ItemDescription>
										<Countdown
											target={joinOpensAt}
											label="Time until you can join"
											completeLabel="Join open"
											onComplete={() => void preflight.refetch()}
										/>
									</ItemContent>
								</Item>
							)}

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

							<ButtonGroup className="w-full">
								<Button
									type="button"
									variant={camera ? "default" : "outline"}
									className="flex-1"
									disabled={companionActive}
									aria-pressed={camera}
									onClick={toggleCamera}
								>
									{camera ? <VideoIcon /> : <VideoOffIcon />}
									Camera
								</Button>
								<Button
									type="button"
									variant={mic ? "default" : "outline"}
									className="flex-1"
									disabled={companionActive}
									aria-pressed={mic}
									onClick={toggleMic}
								>
									{mic ? <MicIcon /> : <MicOffIcon />}
									Microphone
								</Button>
							</ButtonGroup>

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
						<Button
							disabled={!userName || joining || !isLive}
							onClick={() => void handleJoin()}
						>
							{joining ? (
								<Spinner />
							) : isLive ? (
								<VideoIcon />
							) : (
								<CalendarClockIcon />
							)}
							{isLive ? "Join session" : "Waiting for meeting"}
						</Button>
					</CardFooter>
				</Card>
			</FramePanel>
		</Frame>
	);
}

export default function Page() {
	const params = useParams<{ id: string }>();
	const id = params?.id;

	if (!id) return <Loader />;

	return <CallGate id={id} />;
}
