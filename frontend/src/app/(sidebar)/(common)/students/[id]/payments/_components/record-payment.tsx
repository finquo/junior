"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { HandCoinsIcon } from "lucide-react";
import { sileo as toast } from "sileo";
import { CurrencyZod, getCurrencySymbol } from "utils";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
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
import { api, refetchAPIs } from "@/hooks/api";
import type { GetFormZod } from "@/lib/utils";

const recordPaymentSchema = z.object({
	amount: z.string().trim().min(1, "Amount is required"),
	currency: CurrencyZod,
	paidAt: z.string().optional(),
	transactionId: z.string().trim().optional(),
});

type RecordPaymentValues = z.infer<typeof recordPaymentSchema>;

export function RecordPayment({
	id,
	remaining,
	currency,
}: {
	id: string;
	remaining: number;
	currency: string;
}) {
	const { mutateAsync, isPending } = useMutation(
		api.core.student.addPayment.mutationOptions({
			onSuccess: () => {
				refetchAPIs([
					api.core.student.get.queryKey({ input: { id } }),
					api.core.student.getPayments.queryKey({ input: { id } }),
				]);
				toast.success({ title: "Payment recorded" });
			},
		}),
	);

	const form = useForm({
		defaultValues: {
			amount: "",
			currency: (currency || "INR") as RecordPaymentValues["currency"],
			paidAt: new Date().toISOString().slice(0, 10),
			transactionId: "",
		} as RecordPaymentValues,
		validators: {
			onSubmit: recordPaymentSchema as GetFormZod<typeof recordPaymentSchema>,
		},
		onSubmit: async ({ value }) => {
			const amount = Number(value.amount);

			if (Number.isNaN(amount) || amount <= 0) {
				toast.error({ title: "Amount must be a positive number" });
				return;
			}

			if (amount > remaining) {
				toast.error({
					title: "Amount cannot exceed the remaining amount",
					description: `${getCurrencySymbol(value.currency)}${remaining} left to pay`,
				});
				return;
			}

			await mutateAsync({
				id,
				amount,
				currency: value.currency,
				paidAt: value.paidAt ? new Date(value.paidAt) : undefined,
				transactionId: value.transactionId || undefined,
			});

			form.reset();
		},
	});

	return (
		<form
			onSubmit={(event) => {
				event.preventDefault();
				event.stopPropagation();
				form.handleSubmit();
			}}
		>
			<FieldGroup>
				<div className="grid grid-cols-2 gap-4">
					<form.Field
						name="amount"
						children={(field) => {
							const isInvalid =
								field.state.meta.isTouched && !field.state.meta.isValid;
							return (
								<Field data-invalid={isInvalid}>
									<FieldLabel htmlFor={field.name}>
										Amount ({getCurrencySymbol(form.state.values.currency)})
									</FieldLabel>
									<Input
										id={field.name}
										name={field.name}
										type="number"
										placeholder=""
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										aria-invalid={isInvalid}
										disabled={isPending}
									/>
									<FieldDescription>
										Max {getCurrencySymbol(form.state.values.currency)}
										{remaining}
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
						name="currency"
						children={(field) => (
							<Field>
								<FieldLabel htmlFor={field.name}>Currency</FieldLabel>
								<Select
									items={{ INR: "Rupees", USD: "Dollar" }}
									value={field.state.value}
									onValueChange={(value) => field.handleChange(value as never)}
									disabled={isPending}
								>
									<SelectTrigger
										id={field.name}
										className="w-full min-w-[200px]"
									>
										<SelectValue placeholder="Select currency" />
									</SelectTrigger>
									<SelectContent>
										<SelectGroup>
											{Object.entries({ INR: "Rupees", USD: "Dollar" }).map(
												([code, name]) => (
													<SelectItem key={code} value={code}>
														{name}
													</SelectItem>
												),
											)}
										</SelectGroup>
									</SelectContent>
								</Select>
							</Field>
						)}
					/>
				</div>

				<div className="grid grid-cols-2 gap-4">
					<form.Field
						name="paidAt"
						children={(field) => (
							<Field>
								<FieldLabel htmlFor={field.name}>Paid On</FieldLabel>
								<Input
									id={field.name}
									name={field.name}
									type="date"
									value={field.state.value ?? ""}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									disabled={isPending}
								/>
							</Field>
						)}
					/>

					<form.Field
						name="transactionId"
						children={(field) => (
							<Field>
								<FieldLabel htmlFor={field.name}>
									Transaction ID (optional)
								</FieldLabel>
								<Input
									id={field.name}
									name={field.name}
									placeholder="UPI / bank reference"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									disabled={isPending}
								/>
							</Field>
						)}
					/>
				</div>

				<form.Subscribe
					selector={(state) => [state.canSubmit, state.isDirty]}
					children={([canSubmit, isDirty]) => (
						<div className="flex justify-end gap-3">
							<Button
								type="button"
								variant="outline"
								onClick={() => form.reset()}
								disabled={!isDirty || isPending}
							>
								Reset
							</Button>
							<Button
								type="submit"
								disabled={!isDirty || !canSubmit || isPending || remaining <= 0}
							>
								{isPending ? <Spinner /> : <HandCoinsIcon />}
								Record Payment
							</Button>
						</div>
					)}
				/>
			</FieldGroup>
		</form>
	);
}
