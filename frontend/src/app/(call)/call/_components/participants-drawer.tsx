"use client";

import type { Participant } from "@zoom/videosdk";
import { MicIcon, MicOffIcon, UserXIcon } from "lucide-react";
import { sileo as toast } from "sileo";
import { Avatar } from "@/components/arc/avatar/avatar";
import { Button as ArcButton } from "@/components/arc/button/button";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerFooter,
	DrawerInner,
} from "@/components/arc/drawer/drawer";
import {
	Item,
	ItemActions,
	ItemContent,
	ItemGroup,
	ItemMedia,
	ItemTitle,
} from "@/components/arc/item/item";
import { useIsMobile } from "@/hooks/use-mobile";
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
	const isMobile = useIsMobile();
	const side = isMobile ? "bottom" : "right";

	return (
		<Drawer open={open} onOpenChange={onOpenChange}>
			<DrawerContent
				title="Participants"
				description="Everyone currently connected to this session."
				side={side}
			>
				<DrawerInner>
					<ItemGroup>
						{participants.map((participant) => {
							const voiceOn = isVoiceOn(participant);

							return (
								<Item key={participant.userId} variant="outline">
									<ItemMedia>
										<Avatar name={participantName(participant)} size="sm" />
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
												<ArcButton
													size="icon"
													variant="secondary"
													aria-label="Mute"
													disabled={!voiceOn}
													onClick={() =>
														void muteParticipant(participant.userId)
													}
												>
													<MicOffIcon />
												</ArcButton>
												<ArcButton
													size="icon"
													variant="danger"
													aria-label="Remove"
													onClick={() =>
														void removeParticipant(participant.userId)
													}
												>
													<UserXIcon />
												</ArcButton>
											</>
										)}
									</ItemActions>
								</Item>
							);
						})}
					</ItemGroup>
				</DrawerInner>
				<DrawerFooter>
					<ArcButton onClick={() => void invite()}>Invite</ArcButton>
					<DrawerClose asChild>
						<ArcButton variant="secondary">Close</ArcButton>
					</DrawerClose>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
}
