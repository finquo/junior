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
	UserIcon,
	UserXIcon,
	VideoOffIcon,
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
import { cn } from "@/lib/utils";
import {
	isVoiceOn,
	participantName,
	participantRole,
	roleLabel,
	type SessionUser,
} from "./utils";

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

export function VideoTile({
	user,
	className,
	voiceOn,
	videoOn,
	role: roleProp,
	avatar,
	menu = false,
	mirror = false,
	children,
}: {
	user: SessionUser;
	className?: string;
	voiceOn?: boolean;
	videoOn?: boolean;
	role?: string;
	avatar?: string;
	menu?: boolean;
	mirror?: boolean;
	children?: ReactElement;
}) {
	const voice = voiceOn ?? isVoiceOn(user);
	const video = videoOn ?? user.bVideoOn;
	const role = roleProp ?? participantRole(user) ?? "guest";
	const roleName = roleLabel(role);
	const name = participantName(user);

	return (
		<Frame className={cn("overflow-hidden p-0", className)}>
			{children}
			<div className="relative aspect-video">
				<VideoPlayerContainerComponent
					style={{ transform: mirror ? "scaleX(-1)" : undefined }}
				>
					<VideoPlayerComponent user={user} />
				</VideoPlayerContainerComponent>
				{!video && (
					<div className="absolute inset-0">
						<div className="flex size-full flex-row items-center justify-center gap-3">
							<Avatar size="lg">
								<AvatarImage src={avatar} alt={name} />
								<AvatarFallback>
									<UserIcon />
								</AvatarFallback>
							</Avatar>
							<div className="flex flex-col items-start gap-1">
								<span className="font-medium text-sm">{name}</span>
								<span className="text-muted-foreground text-xs">
									{roleName}
								</span>
							</div>
						</div>
					</div>
				)}
				<Badge variant="secondary" className="absolute bottom-2 left-2 gap-1.5">
					{voice ? <MicIcon /> : <MicOffIcon />}
					{video && name}
				</Badge>
				{menu && <RemoteUserMenu user={user} />}
			</div>
		</Frame>
	);
}
