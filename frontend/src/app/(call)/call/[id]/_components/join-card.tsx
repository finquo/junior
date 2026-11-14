"use client";

import type { User } from "better-auth";
import {
	CalendarClockIcon,
	ImageIcon,
	MicIcon,
	MicOffIcon,
	MonitorSmartphoneIcon,
	PenIcon,
	UserRoundIcon,
	VideoIcon,
	VideoOffIcon,
} from "lucide-react";
import Link from "next/link";
import { sileo as toast } from "sileo";
import { Badge } from "@/components/arc/badge/badge";
import { Button as ArcButton } from "@/components/arc/button/button";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/arc/card/card";
import { Countdown } from "@/components/arc/countdown/countdown";
import { Input } from "@/components/arc/input/input";
import { Switch } from "@/components/arc/switch/switch";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemGroup,
	ItemMedia,
	ItemTitle,
} from "@/components/arc/item/item";
import type { useJoinPreferences } from "../../_components/call-preferences";
import { CallPreviewPanel, type CallPreviewState } from "./call-preview";
import type { CallMeeting, PreflightState } from "./hooks";
import { useJoin } from "./hooks";

const JOIN_WINDOW_MS = 10 * 60 * 1000;

type Preferences = ReturnType<typeof useJoinPreferences>;

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
	description?: string;
	id: string;
	checked: boolean;
	disabled?: boolean;
	onCheckedChange: (checked: boolean) => void;
}) {
	return (
		<FieldLabel htmlFor={id}>
			<Field orientation="horizontal" className="items-start">
				<ItemMedia variant="icon">{icon}</ItemMedia>
				<ItemContent>
					<ItemTitle>{label}</ItemTitle>
					{description && <ItemDescription>{description}</ItemDescription>}
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
			</Field>
		</FieldLabel>
	);
}

export function CallJoinCard({
	meeting,
	user,
	higherRole,
	preferences,
	preview,
	guestName,
	preflight,
	id,
}: {
	meeting: CallMeeting;
	user?: User;
	higherRole: boolean;
	preferences: Preferences;
	preview: CallPreviewState;
	guestName: { name: string; setName: (name: string) => void };
	preflight: PreflightState;
	id: string;
}) {
	const { camera, mic, companion, virtualBackground } = preferences;

	const isLive = meeting.status === "live";
	const joinOpensAt = new Date(meeting.startTime).getTime() - JOIN_WINDOW_MS;

	const authName = user?.name?.trim();
	const userName = authName || guestName.name.trim();
	const needsName = !authName;
	const canJoinAsCompanion = higherRole;
	const companionActive = !!(canJoinAsCompanion && companion);
	const contentClassName = companionActive
		? "grid gap-4"
		: "grid gap-4 md:grid-cols-2";

	const { join, joining } = useJoin({
		preflight,
		id,
		mode: user ? "joined" : "guest",
		name: userName,
	});

	const toggleCamera = () => {
		const next = !camera;
		preferences.setCamera(next);
		if (next) toast.success({ title: "Camera on" });
		else toast.info({ title: "Camera off" });
	};

	const toggleMic = () => {
		const next = !mic;
		preferences.setMic(next);
		if (next) toast.success({ title: "Microphone on" });
		else toast.info({ title: "Microphone off" });
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>
					{isLive ? "Ready to join?" : "Waiting for the meeting"}
				</CardTitle>
				<CardDescription>
					{isLive
						? "Turn on the camera or microphone to preview and choose devices before joining."
						: "Join opens 10 minutes before the scheduled start."}
				</CardDescription>
				<CardAction>
					<Badge tone={isLive ? "success" : "info"}>
						{isLive ? "Live" : "Upcoming"}
					</Badge>
				</CardAction>
			</CardHeader>
			<CardContent className={contentClassName}>
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
						<Input
							id="guest-name"
							label="Your name"
							value={guestName.name}
							onChange={(event) => guestName.setName(event.target.value)}
							placeholder="Enter your name"
							autoComplete="name"
						/>
					) : (
						<Item variant="muted">
							<ItemMedia variant="icon">
								<UserRoundIcon />
							</ItemMedia>
							<ItemContent>
								<ItemDescription>Joining as</ItemDescription>
								<ItemTitle>{authName}</ItemTitle>
							</ItemContent>
							<ItemActions>
								<Button variant={"outline"} size={"sm"} asChild>
									<Link href={"/user/edit"}>
										<PenIcon />
										Edit
									</Link>
								</Button>
							</ItemActions>
						</Item>
					)}

					{canJoinAsCompanion && (
						<JoinPreference
							id="join-companion"
							icon={<MonitorSmartphoneIcon />}
							label="Join as companion"
							description="Join without camera or microphone, then share your screen from this device."
							checked={companion}
							onCheckedChange={preferences.setCompanion}
						/>
					)}

					<div className="flex gap-2">
						<JoinPreference
							id="join-video"
							icon={camera ? <VideoIcon /> : <VideoOffIcon />}
							label="Camera"
							checked={camera}
							disabled={companionActive}
							onCheckedChange={toggleCamera}
						/>
						{canJoinAsCompanion && (
							<JoinPreference
								id="join-background"
								icon={<ImageIcon />}
								label="Virtual background"
								checked={virtualBackground}
								disabled={!camera || companionActive}
								onCheckedChange={preferences.setVirtualBackground}
							/>
						)}
					</div>

					<JoinPreference
						id="join-audio"
						icon={mic ? <MicIcon /> : <MicOffIcon />}
						label="Microphone"
						checked={mic}
						disabled={companionActive}
						onCheckedChange={toggleMic}
					/>
				</ItemGroup>

				{!companionActive && <CallPreviewPanel preview={preview} />}
			</CardContent>
			<CardFooter>
				<ArcButton
					loading={joining}
					disabled={!userName || joining || !isLive}
					onClick={() => void join()}
				>
					{isLive ? <VideoIcon /> : <CalendarClockIcon />}
					{isLive ? "Join session" : "Waiting for meeting"}
				</ArcButton>
			</CardFooter>
		</Card>
	);
}
