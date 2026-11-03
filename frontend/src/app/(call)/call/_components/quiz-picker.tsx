"use client";

import { useQuery } from "@tanstack/react-query";
import type { QuizMessage } from "backend/config";
import { BookOpenIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { InputGroupButton } from "@/components/ui/input-group";
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
						<FieldGroup>
							{questions.map((question) => (
								<Field key={question.id} orientation="horizontal">
									<Checkbox
										id={question.id}
										checked={selected.includes(question.id)}
										onCheckedChange={(checked) =>
											setSelected((current) =>
												checked
													? [...current, question.id]
													: current.filter((id) => id !== question.id),
											)
										}
									/>
									<FieldLabel htmlFor={question.id}>
										{question.question}
									</FieldLabel>
								</Field>
							))}
						</FieldGroup>
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
