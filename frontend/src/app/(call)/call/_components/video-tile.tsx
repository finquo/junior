"use client";

import {
	VideoPlayerComponent,
	VideoPlayerContainerComponent,
} from "@zoom/videosdk-react";
import {
	EllipsisIcon,
	MicIcon,
	MicOffIcon,
	PinIcon,
	UserXIcon,
} from "lucide-react";
import type { ReactElement } from "react";
import { Frame } from "@/components/reui/frame";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FetchUser } from "@/hooks/user";
import { cn } from "@/lib/utils";
import {
	isGuestId,
	isVoiceOn,
	participantName,
	roleLabel,
	type SessionUser,
} from "./utils";

export type TileMenu = {
	pinned: boolean;
	moderator: boolean;
	onPin: () => void;
	onMute: () => void;
	onRemove: () => void;
};

function getInitials(name: string) {
	return name
		.split(" ")
		.filter(Boolean)
		.map((part) => part[0])
		.join("")
		.slice(0, 2)
		.toUpperCase();
}

function RemoteUserMenu({ user, menu }: { user: SessionUser; menu: TileMenu }) {
	const name = participantName(user);
	const pinLabel = menu.pinned ? "Unpin" : "Pin";
	const muteDisabled = !isVoiceOn(user);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="secondary"
					size="icon-sm"
					className="absolute top-2 right-2"
					aria-label={`Actions for ${name}`}
				>
					<EllipsisIcon />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuLabel>{name}</DropdownMenuLabel>
				<DropdownMenuItem onSelect={menu.onPin}>
					<PinIcon />
					{pinLabel}
				</DropdownMenuItem>
				{menu.moderator && (
					<>
						<DropdownMenuSeparator />
						<DropdownMenuItem disabled={muteDisabled} onSelect={menu.onMute}>
							<MicOffIcon />
							Mute
						</DropdownMenuItem>
						<DropdownMenuItem variant="destructive" onSelect={menu.onRemove}>
							<UserXIcon />
							Remove
						</DropdownMenuItem>
					</>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

function TileLabels({
	name,
	role,
	inline,
}: {
	name: string;
	role: string;
	inline: boolean;
}) {
	const labelClassName = inline
		? "flex items-center gap-1.5"
		: "flex flex-col items-start gap-1";
	const roleClassName = inline
		? "text-muted-foreground"
		: "text-muted-foreground text-xs";

	return (
		<span className={labelClassName}>
			<span className="font-medium text-sm">{name}</span>
			<span className={roleClassName}>{roleLabel(role)}</span>
		</span>
	);
}

function TileLabel({
	user,
	role,
	inline = false,
}: {
	user: SessionUser;
	role?: string;
	inline?: boolean;
}) {
	const name = participantName(user);
	const fallback = (
		<TileLabels name={name} role={role ?? "guest"} inline={inline} />
	);

	if (!user.userIdentity || isGuestId(user.userIdentity)) return fallback;

	return (
		<FetchUser id={user.userIdentity} isPending={fallback} notFound={fallback}>
			{(dbUser) => (
				<TileLabels
					name={dbUser.name}
					role={role ?? dbUser.role}
					inline={inline}
				/>
			)}
		</FetchUser>
	);
}

export function ParticipantRole({ user }: { user: SessionUser }) {
	const fallback = <Badge>{roleLabel("guest")}</Badge>;

	if (!user.userIdentity || isGuestId(user.userIdentity)) return fallback;

	return (
		<FetchUser id={user.userIdentity} isPending={fallback} notFound={fallback}>
			{(dbUser) => <Badge>{roleLabel(dbUser.role)}</Badge>}
		</FetchUser>
	);
}

export function VideoTile({
	user,
	className,
	voiceOn,
	videoOn,
	role,
	avatar,
	menu,
	self = false,
	children,
}: {
	user: SessionUser;
	className?: string;
	voiceOn?: boolean;
	videoOn?: boolean;
	role?: string;
	avatar?: string;
	menu?: TileMenu;
	self?: boolean;
	children?: ReactElement;
}) {
	const voice = voiceOn ?? isVoiceOn(user);
	const video = videoOn ?? user.bVideoOn;
	const name = participantName(user);
	const VoiceIcon = voice ? MicIcon : MicOffIcon;
	const showInlineLabel = video && !self;
	const mirrorStyle = self ? { transform: "scaleX(-1)" } : undefined;

	return (
		<Frame className={cn("overflow-hidden p-0", className)}>
			<div className="relative aspect-video">
				<VideoPlayerContainerComponent style={mirrorStyle}>
					<VideoPlayerComponent user={user} />
				</VideoPlayerContainerComponent>
				{!video && (
					<div className="absolute inset-0">
						<div className="flex size-full flex-row items-center justify-center gap-3">
							<Avatar size="lg">
								<AvatarImage src={avatar} alt={name} />
								<AvatarFallback>{getInitials(name)}</AvatarFallback>
							</Avatar>
							<TileLabel user={user} role={role} />
						</div>
					</div>
				)}
				<Badge variant="outline" className="absolute bottom-2 left-2">
					<VoiceIcon />
					{showInlineLabel && <TileLabel user={user} role={role} inline />}
				</Badge>
				{menu && <RemoteUserMenu user={user} menu={menu} />}
			</div>
			{children}
		</Frame>
	);
}
