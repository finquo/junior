"use client";

import { useForm } from "@tanstack/react-form";
import { MessageCircleDashedIcon, SendIcon } from "lucide-react";
import { useRef } from "react";
import { z } from "zod";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerInner,
	DrawerTitle,
	DrawerTrigger,
} from "@/components/ui/drawer";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupTextarea,
} from "@/components/ui/input-group";
import { Message, MessageContent } from "@/components/ui/message";
import {
	MessageScroller,
	MessageScrollerButton,
	MessageScrollerContent,
	MessageScrollerItem,
	MessageScrollerProvider,
	MessageScrollerViewport,
} from "@/components/ui/message-scroller";
import type { GetFormZod } from "@/lib/utils";

export type ChatMessage = {
	id: string;
	senderId: string;
	senderName: string;
	text: string;
};

const chatSchema = z.object({
	text: z.string().trim().min(1).max(1000),
});

export function ChatDrawer({
	children,
	messages,
	myUserId,
	onSend,
}: {
	children: React.ReactElement;
	messages: ChatMessage[];
	myUserId?: string;
	onSend: (text: string) => void;
}) {
	const formRef = useRef<HTMLFormElement>(null);

	const form = useForm({
		defaultValues: { text: "" },
		validators: {
			onSubmit: chatSchema as GetFormZod<typeof chatSchema>,
		},
		onSubmit: async ({ value }) => {
			onSend(value.text);
			form.reset();
		},
	});

	return (
		<Drawer>
			<DrawerTrigger asChild>{children}</DrawerTrigger>
			<DrawerContent>
				<DrawerHeader>
					<DrawerTitle>Chat</DrawerTitle>
					<DrawerDescription>
						Messages are visible to everyone in this session.
					</DrawerDescription>
				</DrawerHeader>
				<DrawerInner>
					{messages.length === 0 && (
						<Empty>
							<EmptyHeader>
								<EmptyMedia variant="icon">
									<MessageCircleDashedIcon />
								</EmptyMedia>
								<EmptyTitle>No messages yet</EmptyTitle>
								<EmptyDescription>Say hello to everyone.</EmptyDescription>
							</EmptyHeader>
						</Empty>
					)}
					<MessageScrollerProvider autoScroll>
						<MessageScroller>
							<MessageScrollerViewport>
								<MessageScrollerContent className="gap-4">
									{messages.map((message) => {
										const isMine = message.senderId === myUserId;
										const align = isMine ? "end" : "start";
										const variant = isMine ? "muted" : "default";
										const text = isMine
											? message.text
											: `${message.senderName}: ${message.text}`;

										return (
											<MessageScrollerItem
												key={message.id}
												messageId={message.id}
											>
												<Message align={align}>
													<MessageContent>
														<Bubble align={align} variant={variant}>
															<BubbleContent>{text}</BubbleContent>
														</Bubble>
													</MessageContent>
												</Message>
											</MessageScrollerItem>
										);
									})}
								</MessageScrollerContent>
							</MessageScrollerViewport>
							<MessageScrollerButton />
						</MessageScroller>
					</MessageScrollerProvider>
				</DrawerInner>
				<form
					ref={formRef}
					onSubmit={(event) => {
						event.preventDefault();
						void form.handleSubmit();
					}}
				>
					<form.Field
						name="text"
						children={(field) => (
							<InputGroup>
								<InputGroupTextarea
									id={field.name}
									name={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(event) => field.handleChange(event.target.value)}
									placeholder="Type a message..."
									aria-label="Message"
									onKeyDown={(event) => {
										if (event.key === "Enter" && !event.shiftKey) {
											event.preventDefault();
											formRef.current?.requestSubmit();
										}
									}}
								/>
								<InputGroupAddon align="block-end">
									<InputGroupButton
										type="submit"
										variant="default"
										size="icon-sm"
										className="ml-auto"
										aria-label="Send"
									>
										<SendIcon />
									</InputGroupButton>
								</InputGroupAddon>
							</InputGroup>
						)}
					/>
				</form>
			</DrawerContent>
		</Drawer>
	);
}
