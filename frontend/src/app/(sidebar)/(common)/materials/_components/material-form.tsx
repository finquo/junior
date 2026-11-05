"use client";

import { useForm, useStore } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { InsertMaterialSchema, OrderStatusZod } from "backend/db";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "@/components/ui/empty";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
	FieldLegend,
	FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { UserFormSelector } from "@/components/user-selector";
import { api } from "@/hooks/api";
import { FetchLesson } from "@/hooks/lesson";
import { RenderWhenRole, useHasRole } from "@/hooks/role";
import type { API_Returns } from "@/lib/api";
import type { GetFormZod } from "@/lib/utils";
import { snakeToTitleCase } from "@/lib/utils";

type MaterialListItem = API_Returns["core"]["material"]["list"][number];

const materialFormSchema = InsertMaterialSchema.omit({
	id: true,
	createdAt: true,
	updatedAt: true,
});

export type MaterialFormValues = z.infer<typeof materialFormSchema>;

export function MaterialForm({
	material,
	isPending,
	onSubmit,
}: {
	material?: MaterialListItem;
	isPending: boolean;
	onSubmit: (value: MaterialFormValues) => Promise<void>;
}) {
	const isAdmin = useHasRole("admin");
	const { data: students = [] } = useQuery(
		api.core.student.list.queryOptions(),
	);
	const { data: programs = [] } = useQuery(
		api.core.program.list.queryOptions(),
	);

	const form = useForm({
		defaultValues: {
			name: material?.name,
			studentId: material?.studentId,
			schedulerId: isAdmin ? material?.schedulerId : undefined,
			lessons: material?.lessons ?? [],
			order: material?.order ?? "packing",
			shippingAddress: material?.shippingAddress ?? {},
		} as MaterialFormValues,
		validators: {
			onSubmit: materialFormSchema as GetFormZod<typeof materialFormSchema>,
		},
		onSubmit: async ({ value }) => {
			await onSubmit(value);
		},
	});

	const studentId = useStore(form.store, (s) => s.values.studentId);
	const student = students.find((s) => s.id === studentId);
	const program = programs.find((p) => p.id === student?.program);
	const programLessonIds = program?.lessons ?? [];

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				e.stopPropagation();
				form.handleSubmit();
			}}
		>
			<FieldGroup>
				<form.Field
					name="name"
					children={(field) => (
						<Field data-invalid={field.state.meta.errors.length > 0}>
							<FieldLabel htmlFor={field.name}>Material Name</FieldLabel>
							<Input
								id={field.name}
								name={field.name}
								value={field.state.value ?? ""}
								onBlur={field.handleBlur}
								onChange={(e) => field.handleChange(e.target.value)}
								aria-invalid={field.state.meta.errors.length > 0}
								disabled={isPending}
							/>
							<FieldError errors={field.state.meta.errors} />
						</Field>
					)}
				/>

				<form.Field
					name="studentId"
					children={(field) => (
						<>
							<UserFormSelector
								id={field.name}
								label="Student"
								value={field.state.value}
								onValueChange={(val) => {
									if (!val) return;
									field.handleChange(val);
									form.setFieldValue("lessons", []);
									const selected = students.find((s) => s.id === val);
									if (selected?.address) {
										form.setFieldValue("shippingAddress", selected.address);
									}
								}}
								disabled={isPending}
								api={api.core.student.list.queryOptions()}
							/>
							<FieldError errors={field.state.meta.errors} />
						</>
					)}
				/>

				<RenderWhenRole role={["admin"]}>
					<form.Field
						name="schedulerId"
						children={(field) => (
							<>
								<UserFormSelector
									id={field.name}
									label="Scheduler"
									value={field.state.value}
									onValueChange={(val) => {
										if (val) field.handleChange(val);
									}}
									disabled={isPending}
									api={api.core.scheduler.list.queryOptions()}
								/>
								<FieldError errors={field.state.meta.errors} />
							</>
						)}
					/>
				</RenderWhenRole>

				<form.Field
					name="lessons"
					children={(field) => (
						<FieldSet>
							<FieldLegend>Lessons</FieldLegend>
							{program && (
								<FieldDescription>Program: {program.name}</FieldDescription>
							)}
							{programLessonIds.length === 0 && (
								<Empty>
									<EmptyHeader>
										<EmptyTitle>No program lessons</EmptyTitle>
										<EmptyDescription>
											Select a student with a program to choose lessons.
										</EmptyDescription>
									</EmptyHeader>
								</Empty>
							)}
							<FieldGroup>
								{programLessonIds.map((lessonId) => (
									<Field key={lessonId} orientation="horizontal">
										<Checkbox
											id={lessonId}
											checked={(field.state.value ?? []).includes(lessonId)}
											onCheckedChange={(checked) =>
												field.handleChange(
													checked
														? [...(field.state.value ?? []), lessonId]
														: (field.state.value ?? []).filter(
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

				<form.Field
					name="order"
					children={(field) => (
						<Field data-invalid={field.state.meta.errors.length > 0}>
							<FieldLabel htmlFor={field.name}>Order Status</FieldLabel>
							<Select
								value={field.state.value}
								onValueChange={(val) => {
									const parsed = OrderStatusZod.safeParse(val);
									if (parsed.success) field.handleChange(parsed.data);
								}}
								disabled={isPending}
							>
								<SelectTrigger id={field.name} className="w-full min-w-[200px]">
									<SelectValue placeholder="Select a status" />
								</SelectTrigger>
								<SelectContent alignItemWithTrigger={false}>
									<SelectGroup>
										{OrderStatusZod.options.map((status) => (
											<SelectItem key={status} value={status}>
												{snakeToTitleCase(status)}
											</SelectItem>
										))}
									</SelectGroup>
								</SelectContent>
							</Select>
							<FieldError errors={field.state.meta.errors} />
						</Field>
					)}
				/>

				<FieldSet>
					<FieldLegend>Shipping Address</FieldLegend>
					<FieldGroup>
						<form.Field
							name="shippingAddress.line1"
							children={(field) => (
								<Field data-invalid={field.state.meta.errors.length > 0}>
									<FieldLabel htmlFor={field.name}>Street Line 1</FieldLabel>
									<Input
										id={field.name}
										name={field.name}
										value={field.state.value ?? ""}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder="123 Main St"
										disabled={isPending}
									/>
									<FieldError errors={field.state.meta.errors} />
								</Field>
							)}
						/>
						<form.Field
							name="shippingAddress.line2"
							children={(field) => (
								<Field>
									<FieldLabel htmlFor={field.name}>Street Line 2</FieldLabel>
									<Input
										id={field.name}
										name={field.name}
										value={field.state.value ?? ""}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder="Apt, Suite, Bldg"
										disabled={isPending}
									/>
								</Field>
							)}
						/>
						<form.Field
							name="shippingAddress.city"
							children={(field) => (
								<Field data-invalid={field.state.meta.errors.length > 0}>
									<FieldLabel htmlFor={field.name}>City</FieldLabel>
									<Input
										id={field.name}
										name={field.name}
										value={field.state.value ?? ""}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										disabled={isPending}
									/>
									<FieldError errors={field.state.meta.errors} />
								</Field>
							)}
						/>
						<form.Field
							name="shippingAddress.state"
							children={(field) => (
								<Field data-invalid={field.state.meta.errors.length > 0}>
									<FieldLabel htmlFor={field.name}>State</FieldLabel>
									<Input
										id={field.name}
										name={field.name}
										value={field.state.value ?? ""}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										disabled={isPending}
									/>
									<FieldError errors={field.state.meta.errors} />
								</Field>
							)}
						/>
						<form.Field
							name="shippingAddress.postalCode"
							children={(field) => (
								<Field data-invalid={field.state.meta.errors.length > 0}>
									<FieldLabel htmlFor={field.name}>Postal Code</FieldLabel>
									<Input
										id={field.name}
										name={field.name}
										value={field.state.value ?? ""}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										disabled={isPending}
									/>
									<FieldError errors={field.state.meta.errors} />
								</Field>
							)}
						/>
						<form.Field
							name="shippingAddress.country"
							children={(field) => (
								<Field data-invalid={field.state.meta.errors.length > 0}>
									<FieldLabel htmlFor={field.name}>Country</FieldLabel>
									<Input
										id={field.name}
										name={field.name}
										value={field.state.value ?? ""}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										disabled={isPending}
									/>
									<FieldError errors={field.state.meta.errors} />
								</Field>
							)}
						/>
					</FieldGroup>
				</FieldSet>

				<form.Subscribe selector={(s) => [s.isDirty]}>
					{([isDirty]) => (
						<ButtonGroup>
							<Button
								type="button"
								variant="outline"
								disabled={!isDirty || isPending}
								onClick={() => form.reset()}
							>
								Reset
							</Button>
							<Button type="submit" disabled={isPending}>
								{isPending && <Spinner />}
								Save Material
							</Button>
						</ButtonGroup>
					)}
				</form.Subscribe>
			</FieldGroup>
		</form>
	);
}
