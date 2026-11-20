"use client";

import { useQuery } from "@tanstack/react-query";
import type { QuizMessage } from "backend/config";
import { useState } from "react";
import { QuizList } from "@/components/custom/quiz";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { api } from "@/hooks/api";

export function QuizPicker({
	slotId,
	onSend,
	children,
}: {
	slotId: string;
	children: React.ReactElement;
	onSend: (text: string) => void;
}) {
	const { data: slot } = useQuery(
		api.core.slot.get.queryOptions({ input: { id: slotId } }),
	);
	const lessonId = slot?.lessonId;
	const { data: lesson } = useQuery({
		...api.core.lesson.get.queryOptions({ input: { id: lessonId ?? "" } }),
		enabled: Boolean(lessonId),
	});
	const questions = lesson?.quiz ?? [];
	const [selected, setSelected] = useState<string[]>([]);

	function send(quizIds: string[]) {
		if (!lessonId || quizIds.length === 0) return;

		const message: QuizMessage = {
			type: "quiz",
			slotId,
			lessonId,
			quizIds,
		};

		onSend(JSON.stringify(message));
		setSelected([]);
	}

	function toggle(id: string, checked: boolean) {
		setSelected((current) => {
			if (checked) return [...current, id];
			return current.filter((value) => value !== id);
		});
	}

	return (
		<Dialog>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Pick a quiz</DialogTitle>
					<DialogDescription>
						Choose the questions to send to the student in this session.
					</DialogDescription>
				</DialogHeader>
				<QuizList
					quiz={questions}
					lessonId={lessonId ?? ""}
					selector={(question) => (
						<Checkbox
							id={question.id}
							aria-label={question.question}
							checked={selected.includes(question.id)}
							onCheckedChange={(checked) => toggle(question.id, !!checked)}
						/>
					)}
				/>
				<DialogFooter>
					<DialogClose asChild>
						<Button variant="secondary">Close</Button>
					</DialogClose>
					<DialogClose asChild>
						<Button
							variant="secondary"
							disabled={questions.length === 0}
							onClick={() => send(questions.map((question) => question.id))}
						>
							Send all
						</Button>
					</DialogClose>
					<DialogClose asChild>
						<Button
							disabled={selected.length === 0}
							onClick={() => send(selected)}
						>
							Send
						</Button>
					</DialogClose>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
