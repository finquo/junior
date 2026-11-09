"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { ProgramMaterialZod } from "backend/config";
import { CheckIcon } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { sileo as toast } from "sileo";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
	FieldLegend,
	FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { api, refetchAPIs } from "@/hooks/api";
import { FetchLesson } from "@/hooks/lesson";
import type { GetFormZod } from "@/lib/utils";

const addMaterialSchema = ProgramMaterialZod.omit({ id: true });

export function AddProgramMaterialDialog({
	programId,
	lessonIds,
	children,
}: {
	programId: string;
	lessonIds: string[];
	children: React.ReactElement;
}) {
	const [open, setOpen] = useState(false);

	const addMaterial = useMutation(
		api.core.program.addMaterial.mutationOptions({
			onSuccess: () => {
				refetchAPIs([
					api.core.program.materials.queryKey({ input: { id: programId } }),
					api.core.program.get.queryKey({ input: { id: programId } }),
				]);
				setOpen(false);
				toast.success({ title: "Material added" });
			},
		}),
	);
	const isPending = addMaterial.isPending;

	const form = useForm({
		defaultValues: {
			// name: undefined,
			lessons: [] as string[],
		} as { name: string; lessons: string[] },
		validators: {
			onSubmit: addMaterialSchema as GetFormZod<typeof addMaterialSchema>,
		},
		onSubmit: async ({ value }) => {
			await addMaterial.mutateAsync({
				id: programId,
				name: value.name,
				lessons: value.lessons,
			});
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
					<DialogTitle>Add Material</DialogTitle>
					<DialogDescription>
						Create a material for this program. Lessons are selected here and
						are shown read-only when a material is assigned to a student.
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
							name="name"
							children={(field) => (
								<Field data-invalid={field.state.meta.errors.length > 0}>
									<FieldLabel htmlFor={field.name}>Name</FieldLabel>
									<Input
										id={field.name}
										name={field.name}
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

						<form.Field
							name="lessons"
							children={(field) => (
								<FieldSet>
									<FieldLegend>Lessons</FieldLegend>
									<FieldGroup>
										{lessonIds.map((lessonId) => (
											<Field key={lessonId} orientation="horizontal">
												<Checkbox
													id={lessonId}
													checked={field.state.value.includes(lessonId)}
													onCheckedChange={(checked) =>
														field.handleChange(
															checked
																? [...field.state.value, lessonId]
																: field.state.value.filter(
																		(id) => id !== lessonId,
																	),
														)
													}
													disabled={isPending}
												/>
												<FieldLabel htmlFor={lessonId}>
													<FetchLesson
														id={lessonId}
														isPending={<Skeleton className="h-4 w-24" />}
													>
														{(lesson) => lesson.name}
													</FetchLesson>
												</FieldLabel>
											</Field>
										))}
									</FieldGroup>
									<FieldError errors={field.state.meta.errors} />
								</FieldSet>
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
								Add Material
							</Button>
						</DialogFooter>
					</FieldGroup>
				</form>
			</DialogContent>
		</Dialog>
	);
}
