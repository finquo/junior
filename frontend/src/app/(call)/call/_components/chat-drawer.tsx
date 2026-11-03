"use client";

import { useForm } from "@tanstack/react-form";
import { MessageCircleDashedIcon, PlusIcon, SendIcon } from "lucide-react";
import { useRef } from "react";
import { z } from "zod";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { RenderWhenRole } from "@/hooks/role";
import { type GetFormZod, getInitials } from "@/lib/utils";
import { parseQuizMessage, QuizMessageCard } from "./quiz-message";
import { QuizPicker } from "./quiz-picker";

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
	slotId,
	onSend,
}: {
	children: React.ReactElement;
	messages: ChatMessage[];
	myUserId?: string;
	slotId?: string;
	onSend: (text: string) => void;
}) {
	const formRef = useRef<HTMLFormElement>(null);

	const form = useForm({
		defaultValues: {} as z.infer<typeof chatSchema>,
		validators: {
			onSubmit: chatSchema as GetFormZod<typeof chatSchema>,
		},
		onSubmit: async ({ value }) => {
			if (value?.text?.length) {
				onSend(value.text);
				form.reset();
			}
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
										const quiz = parseQuizMessage(message.text);
										const avatar = (
											<Avatar size="sm">
												<AvatarFallback>
													{getInitials(message.senderName)}
												</AvatarFallback>
											</Avatar>
										);
										const bubble = quiz ? (
											<QuizMessageCard message={quiz} />
										) : (
											<Bubble align={align} variant={variant}>
												<BubbleContent>{message.text}</BubbleContent>
											</Bubble>
										);
										const first = isMine ? bubble : avatar;
										const second = isMine ? avatar : bubble;

										return (
											<MessageScrollerItem
												key={message.id}
												messageId={message.id}
											>
												<Message align={align}>
													<MessageContent>
														{first}
														{second}
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
									value={field.state.value ?? ""}
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
									{slotId && (
										<RenderWhenRole role={["teacher", "scheduler", "admin"]}>
											<QuizPicker slotId={slotId} onSend={onSend}>
												<InputGroupButton
													type="button"
													variant="outline"
													size="icon-sm"
													aria-label="Add"
												>
													<PlusIcon />
												</InputGroupButton>
											</QuizPicker>
										</RenderWhenRole>
									)}
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
