"use client";

import type { QuizMessage } from "backend/config";
import { useEffect, useRef, useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { RenderWhenRole } from "@/hooks/role";
import { useCall } from "./hooks";
import { parseQuizMessage, QuizMessageCard } from "./quiz-message";

/** Students get this dialog the moment a quiz arrives in chat; they can close it and answer later from the chat drawer. */
export function QuizPopup() {
	const { messages, myself, sendChat } = useCall();
	const myUserId = myself?.userId.toString();
	const [queue, setQueue] = useState<QuizMessage[]>([]);
	const initial = useRef<Set<string> | null>(null);
	const seen = useRef(new Set<string>());

	useEffect(() => {
		if (messages.length === 0) return;

		// The first batch is the chat history loaded on connect; only messages that arrive after it pop up.
		if (initial.current === null) {
			initial.current = new Set(messages.map((message) => message.id));
			return;
		}

		for (const message of messages) {
			if (initial.current.has(message.id) || seen.current.has(message.id))
				continue;
			seen.current.add(message.id);
			if (message.senderId === myUserId) continue;

			const quiz = parseQuizMessage(message.text);
			if (quiz) setQueue((pending) => [...pending, quiz]);
		}
	}, [messages, myUserId]);

	const quiz = queue[0];

	return (
		<RenderWhenRole role="student">
			<Dialog
				open={queue.length > 0}
				onOpenChange={(open) => {
					if (!open) setQueue((pending) => pending.slice(1));
				}}
			>
				{quiz && (
					<DialogContent>
						<DialogHeader>
							<DialogTitle>New quiz</DialogTitle>
							<DialogDescription>
								A quiz was sent in the chat. You can also find it there.
							</DialogDescription>
						</DialogHeader>
						<QuizMessageCard message={quiz} onSend={sendChat} />
					</DialogContent>
				)}
			</Dialog>
		</RenderWhenRole>
	);
}
