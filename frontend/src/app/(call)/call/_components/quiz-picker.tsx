"use client";

import { useQuery } from "@tanstack/react-query";
import type { QuizMessage } from "backend/config";
import { useState } from "react";
import { Button as ArcButton } from "@/components/arc/button/button";
import { Checkbox } from "@/components/arc/checkbox/checkbox";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogFooter,
	DialogInner,
	DialogTrigger,
} from "@/components/arc/dialog/dialog";
import { QuizList } from "@/components/custom/quiz";
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
		setSelected((current) =>
			checked ? [...current, id] : current.filter((value) => value !== id),
		);
	}

	return (
		<Dialog>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent
				title="Pick a quiz"
				description="Choose the questions to send to the student in this session."
			>
				<DialogInner>
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
				</DialogInner>
				<DialogFooter>
					<DialogClose asChild>
						<ArcButton variant="secondary">Close</ArcButton>
					</DialogClose>
					<DialogClose asChild>
						<ArcButton
							variant="secondary"
							disabled={questions.length === 0}
							onClick={() => send(questions.map((question) => question.id))}
						>
							Send all
						</ArcButton>
					</DialogClose>
					<DialogClose asChild>
						<ArcButton
							disabled={selected.length === 0}
							onClick={() => send(selected)}
						>
							Send
						</ArcButton>
					</DialogClose>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
