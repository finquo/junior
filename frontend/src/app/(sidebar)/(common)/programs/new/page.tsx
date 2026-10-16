"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { sileo as toast } from "sileo";
import {
	Countries,
	type CountryCodes,
	getCountryCurrencySymbol,
	getCountryName,
} from "utils";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
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
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { api, refetchAPIs } from "@/hooks/api";
import type { GetFormZod } from "@/lib/utils";

const countryCodes = Object.keys(Countries) as CountryCodes[];

const createProgramSchema = z.object({
	name: z.string().trim().min(1, "Program name is required"),
	description: z.string(),
	price: z
		.record(z.string(), z.string())
		.refine(
			(price) => Object.values(price).some((amount) => amount.trim() !== ""),
			{ message: "Enter a price for at least one country" },
		),
});

export default function CreateProgramPage() {
	const router = useRouter();

	const { mutateAsync, isPending } = useMutation(
		api.core.program.create.mutationOptions({
			onSuccess: (programs) => {
				refetchAPIs([api.core.program.list.queryKey()]);
				toast.success({ title: "Program created successfully" });
				const created = programs?.[0];
				if (created) router.push(`/programs/${created.id}` as "/");
			},
			onError: (err) => {
				toast.error({ title: err.message || "Failed to create program" });
			},
		}),
	);

	const form = useForm({
		defaultValues: {
			name: "",
			description: "",
			price: Object.fromEntries(countryCodes.map((code) => [code, ""])),
		} as z.infer<typeof createProgramSchema>,
		validators: {
			onSubmit: createProgramSchema as GetFormZod<typeof createProgramSchema>,
		},
		onSubmit: async ({ value }) => {
			const price = Object.fromEntries(
				Object.entries(value.price)
					.filter(([, amount]) => amount.trim() !== "")
					.map(([code, amount]) => [code, Number(amount)]),
			);

			await mutateAsync({
				name: value.name.trim(),
				description: value.description.trim() || null,
				price,
			});
		},
	});

	return (
		<div>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
			>
				<Card>
					<CardHeader>
						<CardTitle className="text-xl">Create New Program</CardTitle>
						<CardDescription>
							Define the program details and regional pricing.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<FieldGroup>
							<form.Field
								name="name"
								children={(field) => {
									const isInvalid =
										field.state.meta.isTouched && !field.state.meta.isValid;
									return (
										<Field data-invalid={isInvalid}>
											<FieldLabel htmlFor={field.name}>Program Name</FieldLabel>
											<Input
												id={field.name}
												name={field.name}
												placeholder="Financial Literacy Foundations"
												value={field.state.value}
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
								children={(field) => {
									const isInvalid =
										field.state.meta.isTouched && !field.state.meta.isValid;
									return (
										<Field data-invalid={isInvalid}>
											<FieldLabel htmlFor={field.name}>Description</FieldLabel>
											<Textarea
												id={field.name}
												name={field.name}
												placeholder="Overview of the program's objectives, curriculum, and outcomes..."
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
												aria-invalid={isInvalid}
												disabled={isPending}
											/>
											<FieldDescription>
												Optional summary describing what this program covers.
											</FieldDescription>
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
								name="price"
								children={(field) => {
									const isInvalid =
										field.state.meta.isTouched && !field.state.meta.isValid;
									const price = field.state.value;
									return (
										<FieldSet data-invalid={isInvalid}>
											<FieldLegend>Regional Pricing</FieldLegend>
											<FieldDescription>
												Set the program price for at least one country.
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
											{isInvalid && (
												<FieldError
													errors={field.state.meta.errors.map((err) =>
														typeof err === "string" ? { message: err } : err,
													)}
												/>
											)}
										</FieldSet>
									);
								}}
							/>
						</FieldGroup>
					</CardContent>
					<CardFooter className="justify-end">
						<Button variant="outline" asChild disabled={isPending}>
							<Link href="/programs">Cancel</Link>
						</Button>
						<form.Subscribe
							selector={(state) => [state.canSubmit, state.isDirty]}
							children={([canSubmit, isDirty]) => (
								<Button
									type="submit"
									disabled={!canSubmit || !isDirty || isPending}
								>
									{isPending ? <Spinner /> : <PlusIcon />}
									Create Program
								</Button>
							)}
						/>
					</CardFooter>
				</Card>
			</form>
		</div>
	);
}
