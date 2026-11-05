"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { noteZod } from "backend/config";
import { CheckIcon } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { sileo as toast } from "sileo";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { api, refetchAPIs } from "@/hooks/api";
import type { GetFormZod } from "@/lib/utils";

const addNoteSchema = noteZod.pick({ text: true });

export function AddNoteDialog({
	studentId,
	children,
}: {
	studentId: string;
	children: React.ReactElement;
}) {
	const [open, setOpen] = useState(false);

	const addNote = useMutation(
		api.core.student.addNote.mutationOptions({
			onSuccess: () => {
				refetchAPIs([
					api.core.student.get.queryKey({ input: { id: studentId } }),
				]);
				setOpen(false);
				toast.success({ title: "Note added" });
			},
		}),
	);
	const isPending = addNote.isPending;

	const form = useForm({
		defaultValues: { text: "" },
		validators: {
			onSubmit: addNoteSchema as GetFormZod<typeof addNoteSchema>,
		},
		onSubmit: async ({ value }) => {
			await addNote.mutateAsync({ id: studentId, text: value.text });
		},
	});

	const handleOpenChange = (next: boolean) => {
		setOpen(next);
		if (!next) return;
		form.reset();
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Add Note</DialogTitle>
					<DialogDescription>
						Record an observation about this student.
					</DialogDescription>
				</DialogHeader>

				<form
					onSubmit={(event) => {
						event.preventDefault();
						event.stopPropagation();
						form.handleSubmit();
					}}
				>
					<FieldGroup>
						<form.Field
							name="text"
							children={(field) => (
								<Field data-invalid={field.state.meta.errors.length > 0}>
									<FieldLabel htmlFor={field.name}>Note</FieldLabel>
									<Textarea
										id={field.name}
										name={field.name}
										placeholder="Write the note..."
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(event) => field.handleChange(event.target.value)}
										aria-invalid={field.state.meta.errors.length > 0}
										disabled={isPending}
									/>
									<FieldError errors={field.state.meta.errors} />
								</Field>
							)}
						/>

						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => setOpen(false)}
								disabled={isPending}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={isPending}>
								{isPending ? <Spinner /> : <CheckIcon />}
								Save Note
							</Button>
						</DialogFooter>
					</FieldGroup>
				</form>
			</DialogContent>
		</Dialog>
	);
}
