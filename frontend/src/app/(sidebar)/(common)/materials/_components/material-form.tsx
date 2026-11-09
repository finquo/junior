"use client";

import { useForm, useStore } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { InsertMaterialSchema, OrderStatusZod } from "backend/db";
import { useState } from "react";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
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

type AddressSource = "permanent" | "current" | "previous";

const materialFormSchema = InsertMaterialSchema.omit({
	id: true,
	createdAt: true,
	updatedAt: true,
	name: true,
	lessons: true,
	programMaterialId: true,
}).extend({
	programMaterialId: z.string(),
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
	const { data: materials = [] } = useQuery(
		api.core.material.list.queryOptions(),
	);
	const [addressSource, setAddressSource] = useState<AddressSource>();

	const form = useForm({
		defaultValues: {
			studentId: material?.studentId,
			programMaterialId: material?.programMaterialId ?? undefined,
			schedulerId: isAdmin ? material?.schedulerId : undefined,
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
	const programMaterialId = useStore(
		form.store,
		(s) => s.values.programMaterialId,
	);
	const student = students.find((s) => s.id === studentId);
	const program = programs.find((p) => p.id === student?.program);
	const programMaterials = program?.materials ?? [];
	const programMaterialNames = Object.fromEntries(
		programMaterials.map((item) => [item.id, item.name]),
	);
	const selectedMaterial = programMaterials.find(
		(item) => item.id === programMaterialId,
	);
	const previousMaterial = materials.find(
		(item) => item.studentId === studentId && item.id !== material?.id,
	);

	const chooseAddress = (source: AddressSource) => {
		const address =
			source === "permanent"
				? student?.address
				: source === "current"
					? student?.currentAddress
					: previousMaterial?.shippingAddress;

		if (!address) return;

		setAddressSource(source);
		form.setFieldValue("shippingAddress", address);
	};

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
									form.setFieldValue("programMaterialId", undefined as never);
									setAddressSource(undefined);
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
					name="programMaterialId"
					children={(field) => (
						<Field data-invalid={field.state.meta.errors.length > 0}>
							<FieldLabel htmlFor={field.name}>Program Material</FieldLabel>
							<Select
								items={programMaterialNames}
								value={field.state.value}
								onValueChange={(val) => {
									if (val) field.handleChange(val);
								}}
								disabled={isPending || programMaterials.length === 0}
							>
								<SelectTrigger id={field.name} className="w-full min-w-[200px]">
									<SelectValue placeholder="Select a material" />
								</SelectTrigger>
								<SelectContent alignItemWithTrigger={false}>
									<SelectGroup>
										{programMaterials.map((item) => (
											<SelectItem key={item.id} value={item.id}>
												{item.name}
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
					<FieldLegend>Lessons</FieldLegend>
					{program && (
						<FieldDescription>Program: {program.name}</FieldDescription>
					)}
					{!selectedMaterial && (
						<Empty>
							<EmptyHeader>
								<EmptyTitle>No material selected</EmptyTitle>
								<EmptyDescription>
									Select a student and a program material to see its lessons.
								</EmptyDescription>
							</EmptyHeader>
						</Empty>
					)}
					{selectedMaterial?.lessons.map((lessonId) => (
						<Badge key={lessonId} variant="outline">
							<FetchLesson
								id={lessonId}
								isPending={<Skeleton className="h-4 w-24" />}
							>
								{(lesson) => lesson.name}
							</FetchLesson>
						</Badge>
					))}
				</FieldSet>

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

				<Field>
					<FieldLabel htmlFor="addressSource">Address</FieldLabel>
					<Select
						value={addressSource}
						onValueChange={(val) => {
							if (val) chooseAddress(val as AddressSource);
						}}
						disabled={isPending || !student}
					>
						<SelectTrigger id="addressSource" className="w-full min-w-[200px]">
							<SelectValue placeholder="Choose an address" />
						</SelectTrigger>
						<SelectContent alignItemWithTrigger={false}>
							<SelectGroup>
								<SelectItem value="permanent" disabled={!student?.address}>
									Permanent Address
								</SelectItem>
								<SelectItem value="current" disabled={!student?.currentAddress}>
									Current Address
								</SelectItem>
								<SelectItem value="previous" disabled={!previousMaterial}>
									Previous Material Address
								</SelectItem>
							</SelectGroup>
						</SelectContent>
					</Select>
				</Field>

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
