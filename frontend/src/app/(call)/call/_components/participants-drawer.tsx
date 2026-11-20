"use client";

import type { Participant } from "@zoom/videosdk";
import { MicIcon, MicOffIcon, UserXIcon } from "lucide-react";
import { sileo as toast } from "sileo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerInner,
	DrawerSwipeHandle,
	DrawerTitle,
} from "@/components/ui/drawer";
import {
	Item,
	ItemActions,
	ItemContent,
	ItemGroup,
	ItemMedia,
	ItemTitle,
} from "@/components/ui/item";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCall } from "./hooks";
import { ParticipantRole } from "./video-tile";

function getInitials(name: string) {
	return name
		.split(" ")
		.filter(Boolean)
		.map((part) => part[0])
		.join("")
		.slice(0, 2)
		.toUpperCase();
}

function isVoiceOn(participant: Participant) {
	return participant.audio !== "" && participant.muted === false;
}

function participantName(participant: Participant) {
	return participant.displayName || "Guest";
}

const invite = async () => {
	const url = window.location.href;

	if (navigator.share) {
		try {
			await navigator.share({ title: "Join my meeting", url });
			return;
		} catch (error) {
			if (error instanceof DOMException && error.name === "AbortError") return;
		}
	}

	try {
		await navigator.clipboard.writeText(url);
		toast.success({ title: "Invite link copied" });
	} catch {
		toast.error({ title: "Could not copy the invite link" });
	}
};

export function ParticipantsDrawer({
	open,
	onOpenChange,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const {
		participants,
		moderator,
		myself,
		muteParticipant,
		removeParticipant,
	} = useCall();
	const isMobile = useIsMobile();
	const side = isMobile ? "bottom" : "right";

	return (
		<Drawer open={open} onOpenChange={onOpenChange} direction={side}>
			<DrawerContent>
				<DrawerSwipeHandle />
				<DrawerHeader>
					<DrawerTitle>Participants</DrawerTitle>
					<DrawerDescription>
						Everyone currently connected to this session.
					</DrawerDescription>
				</DrawerHeader>
				<DrawerInner>
					<ItemGroup>
						{participants.map((participant) => {
							const voiceOn = isVoiceOn(participant);
							const name = participantName(participant);
							const VoiceIcon = voiceOn ? MicIcon : MicOffIcon;
							const voiceLabel = voiceOn ? "Voice on" : "Voice off";
							const showActions =
								moderator && participant.userId !== myself?.userId;

							return (
								<Item key={participant.userId} variant="outline">
									<ItemMedia>
										<Avatar size="sm">
											<AvatarFallback>{getInitials(name)}</AvatarFallback>
										</Avatar>
									</ItemMedia>
									<ItemContent>
										<ItemTitle>{name}</ItemTitle>
									</ItemContent>
									<ItemActions>
										<VoiceIcon aria-label={voiceLabel} />
										<ParticipantRole user={participant} />
										{showActions && (
											<>
												<Button
													size="icon"
													variant="secondary"
													aria-label="Mute"
													disabled={!voiceOn}
													onClick={() =>
														void muteParticipant(participant.userId)
													}
												>
													<MicOffIcon />
												</Button>
												<Button
													size="icon"
													variant="destructive"
													aria-label="Remove"
													onClick={() =>
														void removeParticipant(participant.userId)
													}
												>
													<UserXIcon />
												</Button>
											</>
										)}
									</ItemActions>
								</Item>
							);
						})}
					</ItemGroup>
				</DrawerInner>
				<DrawerFooter>
					<Button onClick={() => void invite()}>Invite</Button>
					<DrawerClose asChild>
						<Button variant="outline">Close</Button>
					</DrawerClose>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
}
