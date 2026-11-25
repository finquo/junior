"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { InsertCourseSchema } from "backend/db";
import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { sileo as toast } from "sileo";
import {
	Countries,
	type CountryCodes,
	getCountryCurrencySymbol,
	getCountryName,
	type LanguageCodes,
	Languages,
} from "utils";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
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
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { api, refetchAPIs } from "@/hooks/api";
import type { GetFormZod } from "@/lib/utils";

const countryCodes = Object.keys(Countries) as CountryCodes[];

const createCourseSchema = InsertCourseSchema.pick({
	name: true,
	description: true,
	language: true,
}).extend({ price: z.record(z.string(), z.string()) });

export function CreateCourseForm() {
	const router = useRouter();

	const { mutateAsync, isPending } = useMutation(
		api.core.course.create.mutationOptions({
			onSuccess: (courses) => {
				refetchAPIs([
					api.core.course.list.queryKey(),
					api.sidebar.courses.queryKey(),
				]);
				toast.success({ title: "Course created successfully" });
				const created = courses?.[0];
				if (created) router.push(`/courses/${created.id}` as "/");
			},
			onError: (err) => {
				toast.error({ title: err.message || "Failed to create course" });
			},
		}),
	);

	const form = useForm({
		defaultValues: {
			language: "en-IN" as LanguageCodes,
			price: {},
		} as z.infer<typeof createCourseSchema>,
		validators: {
			onSubmit: createCourseSchema as GetFormZod<typeof createCourseSchema>,
		},
		onSubmit: async ({ value }) => {
			const price = Object.fromEntries(
				Object.entries(value.price)
					.filter(([, amount]) => amount.trim() !== "")
					.map(([code, amount]) => [code, Number(amount)]),
			);

			await mutateAsync({
				name: value.name.trim(),
				description: value.description?.trim() || undefined,
				language: value.language,
				price,
			});
		},
	});

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
					children={(field) => {
						const isInvalid =
							field.state.meta.isTouched && !field.state.meta.isValid;
						return (
							<Field data-invalid={isInvalid}>
								<FieldLabel htmlFor={field.name}>Course Name</FieldLabel>
								<Input
									id={field.name}
									name={field.name}
									placeholder="Stock Market Foundations"
									value={field.state.value ?? ""}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									aria-invalid={isInvalid}
									disabled={isPending}
								/>
								{isInvalid && (
									<FieldError
										errors={field.state.meta.errors.map((err) =>
											typeof err === "string" ? { message: err } : err,
										)}
									/>
								)}
							</Field>
						);
					}}
				/>

				<form.Field
					name="description"
					children={(field) => (
						<Field>
							<FieldLabel htmlFor={field.name}>Description</FieldLabel>
							<Textarea
								id={field.name}
								name={field.name}
								placeholder="What this course covers..."
								value={field.state.value ?? ""}
								onBlur={field.handleBlur}
								onChange={(e) =>
									field.handleChange(e.target.value || undefined)
								}
								disabled={isPending}
							/>
							<FieldDescription>
								Optional summary describing what this course covers.
							</FieldDescription>
						</Field>
					)}
				/>

				<form.Field
					name="language"
					children={(field) => (
						<Field>
							<FieldLabel htmlFor={field.name}>Language</FieldLabel>
							<Select
								value={field.state.value}
								onValueChange={(val) =>
									field.handleChange(val as LanguageCodes)
								}
								disabled={isPending}
							>
								<SelectTrigger id={field.name} className="w-full min-w-[200px]">
									<SelectValue placeholder="Select language" />
								</SelectTrigger>
								<SelectContent>
									<SelectGroup>
										{Object.entries(Languages).map(([code, label]) => (
											<SelectItem key={code} value={code}>
												{label}
											</SelectItem>
										))}
									</SelectGroup>
								</SelectContent>
							</Select>
						</Field>
					)}
				/>

				<form.Field
					name="price"
					children={(field) => {
						const price = field.state.value;
						return (
							<FieldSet>
								<FieldLegend>Regional Pricing</FieldLegend>
								<FieldDescription>
									Optional price per country. Leave blank to unset.
								</FieldDescription>
								<FieldGroup>
									{countryCodes.map((code) => (
										<Field key={code}>
											<FieldLabel htmlFor={`price-${code}`}>
												{`${getCountryName(code)} (${getCountryCurrencySymbol(code)})`}
											</FieldLabel>
											<Input
												id={`price-${code}`}
												name={`price.${code}`}
												type="number"
												min={0}
												placeholder="0"
												value={price[code] ?? ""}
												onBlur={field.handleBlur}
												onChange={(e) =>
													field.handleChange({
														...price,
														[code]: e.target.value,
													})
												}
												disabled={isPending}
											/>
										</Field>
									))}
								</FieldGroup>
							</FieldSet>
						);
					}}
				/>

				<ButtonGroup>
					<Button variant="outline" asChild disabled={isPending}>
						<Link href="/courses">Cancel</Link>
					</Button>
					<form.Subscribe
						selector={(state) => [state.canSubmit, state.isDirty]}
						children={([canSubmit, isDirty]) => (
							<Button
								type="submit"
								disabled={!canSubmit || !isDirty || isPending}
							>
								{isPending ? <Spinner /> : <PlusIcon />}
								Create Course
							</Button>
						)}
					/>
				</ButtonGroup>
			</FieldGroup>
		</form>
	);
}
