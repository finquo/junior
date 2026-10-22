"use client";

import type { Participant } from "@zoom/videosdk";
import { MicIcon, MicOffIcon, UserPlusIcon, XIcon } from "lucide-react";
import type { ReactNode } from "react";
import { sileo as toast } from "sileo";
import { CopyButton } from "@/components/copy";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
	DrawerTrigger,
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

function isVoiceOn(participant: Participant) {
	return participant.audio !== "" && participant.muted === false;
}

function participantName(participant: Participant) {
	return participant.displayName || "Guest";
}

export function ParticipantsDrawer({
	participants,
	children,
}: {
	participants: Participant[];
	children: ReactNode;
}) {
	const invite = async () => {
		const url = window.location.href;

		if (navigator.share) {
			try {
				await navigator.share({ title: "Join my meeting", url });
				return;
			} catch (error) {
				if (error instanceof DOMException && error.name === "AbortError")
					return;
			}
		}

		try {
			await navigator.clipboard.writeText(url);
			toast.success({ title: "Invite link copied" });
		} catch {
			toast.error({ title: "Could not copy the invite link" });
		}
	};

	return (
		<Drawer>
			<DrawerTrigger asChild>{children}</DrawerTrigger>
			<DrawerContent>
				<DrawerHeader>
					<Item size="xs">
						<ItemContent>
							<DrawerTitle>Participants ({participants.length})</DrawerTitle>
							<DrawerDescription>
								Everyone currently connected to this session.
							</DrawerDescription>
						</ItemContent>
						<ItemActions>
							<CopyButton
								text={() => window.location.href}
								label="meeting link"
								variant="ghost"
								size="icon"
							/>
						</ItemActions>
					</Item>
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
										{participant.isHost && <Badge>Host</Badge>}
										{!participant.isHost && participant.isManager && (
											<Badge variant="secondary">Manager</Badge>
										)}
									</ItemActions>
								</Item>
							);
						})}
					</ItemGroup>
				</DrawerInner>
				<DrawerFooter>
					<DrawerClose asChild>
						<Button variant="outline">
							<XIcon />
							Close
						</Button>
					</DrawerClose>
					<Button onClick={() => void invite()}>
						<UserPlusIcon />
						Invite
					</Button>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
}
