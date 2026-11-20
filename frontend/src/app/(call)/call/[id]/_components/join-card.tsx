"use client";

import type { User } from "better-auth";
import { cn } from "cn";
import {
	CalendarClockIcon,
	ImageIcon,
	MessageSquarePlusIcon,
	MicIcon,
	MicOffIcon,
	MonitorSmartphoneIcon,
	PenIcon,
	UserRoundIcon,
	VideoIcon,
	VideoOffIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { sileo as toast } from "sileo";
import { FeedbackDialog } from "@/components/custom/feedback-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
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

function formatRemaining(ms: number) {
	const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
	const days = Math.floor(totalSeconds / 86400);
	const hours = Math.floor((totalSeconds % 86400) / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;

	if (days > 0) {
		return `${days}d ${hours}h ${minutes}m ${seconds}s`;
	}
	if (hours > 0) {
		return `${hours}h ${minutes}m ${seconds}s`;
	}
	if (minutes > 0) {
		return `${minutes}m ${seconds}s`;
	}
	return `${seconds}s`;
}

function JoinCountdown({
	target,
	completeLabel,
	onComplete,
}: {
	target: number;
	completeLabel: string;
	onComplete: () => void;
}) {
	const [now, setNow] = useState(() => Date.now());
	const completedRef = useRef(false);
	const remaining = target - now;
	const complete = remaining <= 0;

	useEffect(() => {
		if (complete) {
			return;
		}

		const timer = window.setInterval(() => {
			setNow(Date.now());
		}, 1000);

		return () => window.clearInterval(timer);
	}, [complete]);

	useEffect(() => {
		if (!complete || completedRef.current) {
			return;
		}

		completedRef.current = true;
		onComplete();
	}, [complete, onComplete]);

	if (complete) {
		return <span>{completeLabel}</span>;
	}

	return <span>{formatRemaining(remaining)}</span>;
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
		<FieldLabel htmlFor={id} className="w-full">
			<Field
				orientation="horizontal"
				className={description ? "items-start" : undefined}
			>
				<ItemMedia variant="icon">{icon}</ItemMedia>
				<FieldContent>
					<span className="font-medium text-sm leading-snug">{label}</span>
					{description && (
						<span className="text-muted-foreground text-sm">{description}</span>
					)}
				</FieldContent>
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
					<Badge variant={isLive ? "success" : "info"}>
						{isLive ? "Live" : "Upcoming"}
					</Badge>
				</CardAction>
			</CardHeader>
			<CardContent
				className={cn("grid gap-4", !companionActive ? "md:grid-cols-2" : "")}
			>
				<ItemGroup>
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
								<ItemTitle>
									<JoinCountdown
										target={joinOpensAt}
										completeLabel="Join open"
										onComplete={() => void preflight.refetch()}
									/>
								</ItemTitle>
							</ItemContent>
						</Item>
					)}

					{needsName ? (
						<Field>
							<FieldLabel htmlFor="guest-name">Your name</FieldLabel>
							<Input
								id="guest-name"
								value={guestName.name}
								onChange={(event) => guestName.setName(event.target.value)}
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
							<ItemActions>
								<Button variant="outline" size="sm" asChild>
									<Link href="/user/edit">
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
							checked={companion}
							onCheckedChange={preferences.setCompanion}
						/>
					)}

					{!companion && (
						<div className="flex flex-wrap gap-2 lg:flex-nowrap">
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
					)}

					{!companion && (
						<JoinPreference
							id="join-audio"
							icon={mic ? <MicIcon /> : <MicOffIcon />}
							label="Microphone"
							checked={mic}
							disabled={companionActive}
							onCheckedChange={toggleMic}
						/>
					)}
				</ItemGroup>

				{!companionActive && (
					<div className="hidden md:block">
						<CallPreviewPanel preview={preview} />
					</div>
				)}
			</CardContent>
			<CardFooter>
				<FeedbackDialog type="join" reference={`slot:${id}`}>
					<Button variant="secondary">
						<MessageSquarePlusIcon />
						Report an issue
					</Button>
				</FeedbackDialog>
				<Button
					disabled={!userName || joining || !isLive}
					onClick={() => void join()}
				>
					{joining ? <Spinner /> : isLive ? <VideoIcon /> : <CalendarClockIcon />}
					{isLive ? "Join session" : "Waiting for meeting"}
				</Button>
			</CardFooter>
		</Card>
	);
}
