"use client";

import { useForm } from "@tanstack/react-form";
import { MessageCircleDashedIcon, PlusIcon, SendIcon } from "lucide-react";
import { useRef } from "react";
import { z } from "zod";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bubble, BubbleContent, BubbleHeader } from "@/components/ui/bubble";
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerInner,
	DrawerSwipeHandle,
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
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { RenderWhenRole } from "@/hooks/role";
import { useIsMobile } from "@/hooks/use-mobile";
import { FetchUser } from "@/hooks/user";
import type { GetFormZod } from "@/lib/utils";
import { useCall } from "./hooks";
import {
	parseQuizAnswerMessage,
	parseQuizMessage,
	QuizAnswerCard,
	QuizMessageCard,
} from "./quiz-message";
import { QuizPicker } from "./quiz-picker";
import { isGuestId, roleLabel } from "./utils";

function getInitials(name: string) {
	return name
		.split(" ")
		.filter(Boolean)
		.map((part) => part[0])
		.join("")
		.slice(0, 2)
		.toUpperCase();
}

function SenderLabel({
	name,
	userRole,
	image,
}: {
	name: string;
	userRole: string;
	image?: string | null;
}) {
	return (
		<Tooltip>
			<TooltipTrigger className="flex items-center gap-1">
				<Avatar size="sm">
					<AvatarImage src={image} alt={name} />
					<AvatarFallback>{getInitials(name)}</AvatarFallback>
				</Avatar>
				{name}
			</TooltipTrigger>
			<TooltipContent>{roleLabel(userRole)}</TooltipContent>
		</Tooltip>
	);
}

function ChatSender({ name, identity }: { name: string; identity?: string }) {
	const fallback = <SenderLabel name={name} userRole="guest" />;

	if (!identity || isGuestId(identity)) return fallback;

	return (
		<FetchUser id={identity} isPending={fallback} notFound={fallback}>
			{(dbUser) => (
				<SenderLabel
					name={dbUser.name}
					userRole={dbUser.role}
					image={dbUser.image}
				/>
			)}
		</FetchUser>
	);
}

const chatSchema = z.object({
	text: z.string().trim().min(1).max(1000),
});

export function ChatDrawer({
	children,
	open,
	onOpenChange,
}: {
	children?: React.ReactElement;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
}) {
	const {
		messages,
		markChatRead,
		participants,
		myself,
		slotId,
		sendChat: onSend,
	} = useCall();
	const myUserId = myself?.userId.toString();
	const formRef = useRef<HTMLFormElement>(null);
	const isMobile = useIsMobile();
	const side = isMobile ? "bottom" : "right";
	const heightStyle = isMobile ? { height: "min(32rem, 70dvh)" } : undefined;

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
		<Drawer
			open={open}
			onOpenChange={(next) => {
				if (next) markChatRead();
				onOpenChange?.(next);
			}}
			direction={side}
		>
			{children && <DrawerTrigger asChild>{children}</DrawerTrigger>}
			<DrawerContent style={heightStyle}>
				<DrawerSwipeHandle />
				<DrawerHeader>
					<DrawerTitle>Chat</DrawerTitle>
					<DrawerDescription>
						Messages are visible to everyone in this session.
					</DrawerDescription>
				</DrawerHeader>
				<DrawerInner className="flex flex-col gap-2">
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
						<MessageScroller className="flex-1">
							<MessageScrollerViewport>
								<MessageScrollerContent className="gap-2">
									{messages.map((message, index) => {
										const isMine = message.senderId === myUserId;
										const align = isMine ? "end" : "start";
										const variant = isMine ? "muted" : "default";

										const quiz = parseQuizMessage(message.text);
										const answer = parseQuizAnswerMessage(message.text);
										const identity = participants.find(
											(participant) =>
												participant.userId.toString() === message.senderId,
										)?.userIdentity;

										const showDetails =
											!isMine &&
											messages[index - 1]?.senderId !== message.senderId;

										let bubble: React.ReactNode = message.text;
										if (quiz) {
											bubble = <QuizMessageCard message={quiz} onSend={onSend} />;
										} else if (answer) {
											bubble = <QuizAnswerCard message={answer} />;
										}

										return (
											<MessageScrollerItem
												key={message.id}
												messageId={message.id}
											>
												<Message align={align}>
													<MessageContent>
														<Bubble align={align} variant={variant}>
															{showDetails && (
																<BubbleHeader>
																	<ChatSender
																		name={message.senderName}
																		identity={identity}
																	/>
																</BubbleHeader>
															)}
															<BubbleContent>{bubble}</BubbleContent>
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
				</DrawerInner>
			</DrawerContent>
		</Drawer>
	);
}
