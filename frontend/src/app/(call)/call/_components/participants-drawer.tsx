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
import { getInitials } from "@/lib/utils";
import { useCall } from "./hooks";
import { ParticipantRole } from "./video-tile";

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

	return (
		<Drawer open={open} onOpenChange={onOpenChange}>
			<DrawerContent>
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

							return (
								<Item key={participant.userId} variant="outline">
									<ItemMedia>
										<Avatar size="sm">
											<AvatarFallback>
												{getInitials(participantName(participant))}
											</AvatarFallback>
										</Avatar>
									</ItemMedia>
									<ItemContent>
										<ItemTitle>{participantName(participant)}</ItemTitle>
									</ItemContent>
									<ItemActions>
										{voiceOn ? (
											<MicIcon aria-label="Voice on" />
										) : (
											<MicOffIcon aria-label="Voice off" />
										)}
										<ParticipantRole user={participant} />
										{moderator && participant.userId !== myself?.userId && (
											<>
												<Button
													size="icon-sm"
													variant="outline"
													aria-label="Mute"
													disabled={!voiceOn}
													onClick={() =>
														void muteParticipant(participant.userId)
													}
												>
													<MicOffIcon />
												</Button>
												<Button
													size="icon-sm"
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
