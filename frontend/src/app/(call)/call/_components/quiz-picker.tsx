"use client";

import { useQuery } from "@tanstack/react-query";
import type { QuizMessage } from "backend/config";
import { BookOpenIcon } from "lucide-react";
import { useState } from "react";
import { QuizList } from "@/components/custom/quiz";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
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
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
		<DropdownMenu>
			<DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
			<DropdownMenuContent align="start" side="top">
				<Dialog>
					<DialogTrigger asChild>
						<DropdownMenuItem onSelect={(event) => event.preventDefault()}>
							<BookOpenIcon />
							Pick a quiz
						</DropdownMenuItem>
					</DialogTrigger>
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
								<Button variant="outline">Close</Button>
							</DialogClose>
							<ButtonGroup>
								<DialogClose asChild>
									<Button
										variant="outline"
										disabled={questions.length === 0}
										onClick={() =>
											send(questions.map((question) => question.id))
										}
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
							</ButtonGroup>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
