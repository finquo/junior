"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeftIcon, SaveIcon } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { sileo as toast } from "sileo";
import {
	Countries,
	type CountryCodes,
	getCountryCurrencySymbol,
	getCountryName,
} from "utils";
import { z } from "zod";
import Loader from "@/components/loader";
import {
	Frame,
	FrameActions,
	FrameDescription,
	FrameHeader,
	FramePanel,
	FrameTitle,
} from "@/components/reui/frame";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { api, refetchAPIs } from "@/hooks/api";
import type { GetFormZod } from "@/lib/utils";

const countryCodes = Object.keys(Countries) as CountryCodes[];

const editProgramSchema = z.object({
	name: z.string().trim().min(1, "Program name is required"),
	description: z.string(),
	price: z
		.record(z.string(), z.string())
		.refine(
			(price) => Object.values(price).some((amount) => amount.trim() !== ""),
			{ message: "Enter a price for at least one country" },
		),
});

function EditProgram({ programId }: { programId: string }) {
	const router = useRouter();

	const {
		data: program,
		isPending,
		isError,
	} = useQuery(api.core.program.get.queryOptions({ input: { id: programId } }));

	const { mutateAsync, isPending: isSaving } = useMutation(
		api.core.program.update.mutationOptions({
			onSuccess: () => {
				refetchAPIs([
					api.core.program.list.queryKey(),
					api.core.program.get.queryKey({ input: { id: programId } }),
				]);
				toast.success({ title: "Program updated successfully" });
				router.push(`/programs/${programId}` as "/");
			},
			onError: (err) => {
				toast.error({ title: err.message || "Failed to update program" });
			},
		}),
	);

	const form = useForm({
		defaultValues: {
			name: program?.name ?? "",
			description: program?.description ?? "",
			price: Object.fromEntries(
				countryCodes.map((code) => [code, String(program?.price[code] ?? "")]),
			),
		} as z.infer<typeof editProgramSchema>,
		validators: {
			onSubmit: editProgramSchema as GetFormZod<typeof editProgramSchema>,
		},
		onSubmit: async ({ value }) => {
			const price = Object.fromEntries(
				Object.entries(value.price)
					.filter(([, amount]) => amount.trim() !== "")
					.map(([code, amount]) => [code, Number(amount)]),
			);

			await mutateAsync({
				id: programId,
				name: value.name.trim(),
				description: value.description.trim() || null,
				price,
			});
		},
	});

	useEffect(() => {
		if (!program) return;
		form.reset({
			name: program.name,
			description: program.description ?? "",
			price: Object.fromEntries(
				countryCodes.map((code) => [code, String(program.price[code] ?? "")]),
			),
		} as z.infer<typeof editProgramSchema>);
	}, [form, program]);

	if (isPending) {
		return <Loader />;
	}

	if (isError || !program) {
		return (
			<Alert variant="destructive">
				<AlertTitle>Program Not Found</AlertTitle>
				<AlertDescription>
					The requested program could not be loaded or does not exist.
				</AlertDescription>
			</Alert>
		);
	}

	return (
		<Frame>
			<FrameHeader>
				<FrameTitle>Edit Program</FrameTitle>
				<FrameDescription>
					Update the program details and regional pricing
				</FrameDescription>
				<FrameActions>
					<Button asChild variant="outline">
						<Link href={`/programs/${programId}` as "/"}>
							<ArrowLeftIcon />
							Program
						</Link>
					</Button>
				</FrameActions>
			</FrameHeader>
			<FramePanel>
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
										<FieldLabel htmlFor={field.name}>Program Name</FieldLabel>
										<Input
											id={field.name}
											name={field.name}
											placeholder="Financial Literacy Foundations"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											aria-invalid={isInvalid}
											disabled={isSaving}
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
										placeholder="Overview of the program's objectives, curriculum, and outcomes..."
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										disabled={isSaving}
									/>
									<FieldDescription>
										Optional summary describing what this program covers.
									</FieldDescription>
								</Field>
							)}
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
														disabled={isSaving}
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

						<ButtonGroup>
							<Button variant="outline" asChild disabled={isSaving}>
								<Link href={`/programs/${programId}` as "/"}>Cancel</Link>
							</Button>
							<form.Subscribe
								selector={(state) => [state.canSubmit, state.isDirty]}
								children={([canSubmit, isDirty]) => (
									<Button
										type="submit"
										disabled={!canSubmit || !isDirty || isSaving}
									>
										{isSaving ? <Spinner /> : <SaveIcon />}
										Save Changes
									</Button>
								)}
							/>
						</ButtonGroup>
					</FieldGroup>
				</form>
			</FramePanel>
		</Frame>
	);
}

export default function Page() {
	const params = useParams<{ id: string }>();
	const programId = params?.id;

	if (!programId) {
		return (
			<Alert variant="destructive">
				<AlertTitle>Invalid Program ID</AlertTitle>
				<AlertDescription>
					No program identifier was found in the URL.
				</AlertDescription>
			</Alert>
		);
	}

	return <EditProgram programId={programId} />;
}
