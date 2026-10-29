"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarIcon, HandCoinsIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { sileo as toast } from "sileo";
import { Currencies, CurrencyZod, getCurrencySymbol } from "utils";
import z from "zod";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Calendar } from "@/components/ui/calendar";
import {
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { UserFormSelector } from "@/components/user-selector";
import { api, refetchAPIs } from "@/hooks/api";
import type { API_Returns } from "@/lib/api";
import type { GetFormZod } from "@/lib/utils";

const basePaymentSchema = z.object({
	amount: z.string().trim().min(1, "Amount is required"),
	currency: CurrencyZod,
	paidAt: z.string().optional(),
	transactionId: z.string().trim().optional(),
});

const newPaymentSchema = basePaymentSchema.extend({
	studentId: z.string().min(1, "Student is required"),
});

const editPaymentSchema = basePaymentSchema.omit({ currency: true });

function AmountField({
	value,
	symbol,
	remaining,
	label,
	isPending,
	onBlur,
	onChange,
}: {
	value: string;
	symbol: string;
	remaining: number;
	label?: string;
	isPending: boolean;
	onBlur: () => void;
	onChange: (value: string) => void;
}) {
	return (
		<Field>
			<FieldLabel htmlFor="amount">Amount ({symbol})</FieldLabel>
			<Input
				id="amount"
				name="amount"
				type="number"
				placeholder=""
				value={value}
				onBlur={onBlur}
				onChange={(e) => onChange(e.target.value)}
				disabled={isPending}
			/>
			<FieldDescription>
				{label ?? "Remaining"} {symbol}
				{remaining.toLocaleString()}
			</FieldDescription>
		</Field>
	);
}

function CurrencyField({
	value,
	isPending,
	onChange,
}: {
	value: string;
	isPending: boolean;
	onChange: (value: string) => void;
}) {
	return (
		<Field>
			<FieldLabel htmlFor="currency">Currency</FieldLabel>
			<Select
				items={Currencies}
				value={value}
				onValueChange={(next) => next && onChange(next)}
				disabled={isPending}
			>
				<SelectTrigger id="currency" className="w-full min-w-[200px]">
					<SelectValue placeholder="Select currency" />
				</SelectTrigger>
				<SelectContent>
					<SelectGroup>
						{Object.entries(Currencies).map(([code, name]) => (
							<SelectItem key={code} value={code}>
								{name}
							</SelectItem>
						))}
					</SelectGroup>
				</SelectContent>
			</Select>
		</Field>
	);
}

function PaidAtField({
	value,
	isPending,
	onChange,
}: {
	value: string;
	isPending: boolean;
	onChange: (value: string) => void;
}) {
	const [open, setOpen] = useState(false);

	return (
		<Field>
			<FieldLabel htmlFor="paidAt">Paid On</FieldLabel>
			<Popover open={isPending ? false : open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						id="paidAt"
						variant="outline"
						className="w-full justify-start font-normal"
						disabled={isPending}
					>
						<CalendarIcon />
						{value ? format(new Date(value), "MMM d, yyyy") : "Pick a date"}
					</Button>
				</PopoverTrigger>
				<PopoverContent align="start" className="w-auto p-0">
					<Calendar
						mode="single"
						captionLayout="dropdown"
						selected={value ? new Date(value) : undefined}
						onSelect={(date) => {
							onChange(
								date
									? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
									: "",
							);
							setOpen(false);
						}}
					/>
				</PopoverContent>
			</Popover>
		</Field>
	);
}

function TransactionIdField({
	value,
	isPending,
	onBlur,
	onChange,
}: {
	value: string | undefined;
	isPending: boolean;
	onBlur: () => void;
	onChange: (value: string) => void;
}) {
	return (
		<Field>
			<FieldLabel htmlFor="transactionId">Transaction ID (optional)</FieldLabel>
			<Input
				id="transactionId"
				name="transactionId"
				placeholder="UPI / bank reference"
				value={value}
				onBlur={onBlur}
				onChange={(e) => onChange(e.target.value)}
				disabled={isPending}
			/>
		</Field>
	);
}

function SubmitActions({
	isPending,
	isDirty,
	canSubmit,
	onReset,
	submitDisabled,
	label,
}: {
	isPending: boolean;
	isDirty: boolean;
	canSubmit: boolean;
	onReset: () => void;
	submitDisabled?: boolean;
	label: string;
}) {
	return (
		<div className="flex justify-end gap-3">
			<Button
				type="button"
				variant="outline"
				onClick={onReset}
				disabled={!isDirty || isPending}
			>
				Reset
			</Button>
			<Button
				type="submit"
				disabled={!isDirty || !canSubmit || isPending || submitDisabled}
			>
				{isPending ? <Spinner /> : <HandCoinsIcon />}
				{label}
			</Button>
		</div>
	);
}

export function NewPaymentForm() {
	const [selectedStudentId, setSelectedStudentId] = useState<string>("");
	const { mutateAsync, isPending } = useMutation(
		api.core.payment.create.mutationOptions({
			onSuccess: () => {
				refetchAPIs([api.core.payment.list.queryKey({ input: {} })]);
				toast.success({ title: "Payment recorded" });
			},
			onError: (error) => {
				toast.error({ title: error.message || "Failed to record payment" });
			},
		}),
	);

	const form = useForm({
		defaultValues: {
			studentId: "",
			amount: "",
			currency: "INR" as z.infer<typeof basePaymentSchema>["currency"],
			paidAt: new Date().toISOString().slice(0, 10),
			transactionId: "",
		} as z.infer<typeof newPaymentSchema>,
		validators: {
			onSubmit: newPaymentSchema as GetFormZod<typeof newPaymentSchema>,
		},
		onSubmit: async ({ value }) => {
			const amount = Number(value.amount);

			if (Number.isNaN(amount) || amount <= 0) {
				toast.error({ title: "Amount must be a positive number" });
				return;
			}

			await mutateAsync({
				studentId: value.studentId,
				amount,
				currency: value.currency,
				paidAt: value.paidAt ? new Date(value.paidAt) : undefined,
				transactionId: value.transactionId || undefined,
			});

			form.reset();
		},
	});

	const selectedViewerId = selectedStudentId;

	const { data: student } = useQuery(
		api.core.student.get.queryOptions({
			...{ input: { id: selectedViewerId ?? "" } },
			enabled: Boolean(selectedViewerId),
		}),
	);

	const remaining = student?.remaining ?? 0;
	const currency = student?.currency ?? "INR";

	return (
		<form
			onSubmit={(event) => {
				event.preventDefault();
				event.stopPropagation();
				form.handleSubmit();
			}}
		>
			<FieldGroup>
				<form.Field
					name="studentId"
					children={(field) => (
						<UserFormSelector
							id={field.name}
							label="Student"
							value={field.state.value}
							onValueChange={(id) => {
								field.handleChange(id ?? "");
								setSelectedStudentId(id ?? "");
							}}
							disabled={isPending}
							api={api.core.student.list.queryOptions()}
						/>
					)}
				/>

				{selectedStudentId && student === null && (
					<Alert variant="destructive">
						<AlertTitle>Student Not Found</AlertTitle>
						<AlertDescription>
							The selected student could not be loaded.
						</AlertDescription>
					</Alert>
				)}

				{selectedStudentId && !student?.program && (
					<Alert variant="destructive">
						<AlertTitle>Program Required</AlertTitle>
						<AlertDescription>
							Assign a program to this student before recording payments.
						</AlertDescription>
					</Alert>
				)}

				<form.Field
					name="amount"
					children={(field) => (
						<Field>
							<FieldLabel htmlFor="amount">
								Amount ({getCurrencySymbol(currency)})
							</FieldLabel>
							<ButtonGroup>
								{[
									...new Set(
										[
											student?.amount ?? 0,
											remaining,
											500,
											1000,
											5000,
											10000,
										].filter((value) => value > 0),
									),
								].map((value) => (
									<Button
										key={value}
										type="button"
										variant={
											String(value) === field.state.value
												? "default"
												: "outline"
										}
										onClick={() => field.handleChange(String(value))}
										disabled={isPending || value > remaining}
									>
										{getCurrencySymbol(currency)}
										{value.toLocaleString()}
									</Button>
								))}
							</ButtonGroup>
							<AmountField
								value={field.state.value}
								symbol={getCurrencySymbol(currency)}
								remaining={remaining}
								isPending={isPending}
								onBlur={field.handleBlur}
								onChange={(next) => field.handleChange(next)}
							/>
						</Field>
					)}
				/>

				<div className="grid grid-cols-2 gap-4">
					<form.Field
						name="paidAt"
						children={(field) => (
							<PaidAtField
								value={field.state.value ?? ""}
								isPending={isPending}
								onChange={(next) => field.handleChange(next)}
							/>
						)}
					/>

					<form.Field
						name="currency"
						children={(field) => (
							<CurrencyField
								value={field.state.value}
								isPending={isPending}
								onChange={(next) =>
									field.handleChange(
										next as z.infer<typeof basePaymentSchema>["currency"],
									)
								}
							/>
						)}
					/>
				</div>

				<form.Field
					name="transactionId"
					children={(field) => (
						<TransactionIdField
							value={field.state.value}
							isPending={isPending}
							onBlur={field.handleBlur}
							onChange={(next) => field.handleChange(next)}
						/>
					)}
				/>

				<form.Subscribe
					selector={(state) => state}
					children={(state) => (
						<SubmitActions
							isPending={isPending}
							isDirty={state.isDirty}
							canSubmit={state.canSubmit}
							onReset={() => form.reset()}
							submitDisabled={remaining <= 0}
							label="Record Payment"
						/>
					)}
				/>
			</FieldGroup>
		</form>
	);
}

export function EditPaymentForm({
	payment,
	remaining,
}: {
	payment: NonNullable<API_Returns["core"]["payment"]["get"]>;
	remaining: number;
}) {
	const router = useRouter();

	const max = remaining + payment.amount;
	const symbol = getCurrencySymbol(payment.currency);

	const { mutateAsync, isPending } = useMutation(
		api.core.payment.update.mutationOptions({
			onSuccess: (_data, input) => {
				refetchAPIs([
					api.core.payment.get.queryKey({ input: { id: input.id } }),
				]);
				toast.success({ title: "Payment updated" });
				router.push(`/payments/${payment.id}` as "/");
			},
			onError: (error) => {
				toast.error({ title: error.message || "Failed to update payment" });
			},
		}),
	);

	const form = useForm({
		defaultValues: {
			amount: String(payment.amount),
			paidAt: payment.paidAt
				? new Date(payment.paidAt).toISOString().slice(0, 10)
				: "",
			transactionId: payment.transactionId ?? "",
		} as z.infer<typeof editPaymentSchema>,
		validators: {
			onSubmit: editPaymentSchema as GetFormZod<typeof editPaymentSchema>,
		},
		onSubmit: async ({ value }) => {
			const amount = Number(value.amount);

			if (Number.isNaN(amount) || amount <= 0) {
				toast.error({ title: "Amount must be a positive number" });
				return;
			}

			if (amount > max) {
				toast.error({
					title: "Amount cannot exceed the remaining amount",
					description: `Up to ${symbol}${max.toLocaleString()} allowed for this payment`,
				});
				return;
			}

			await mutateAsync({
				id: payment.id,
				amount,
				paidAt: value.paidAt ? new Date(value.paidAt) : undefined,
				transactionId: value.transactionId || undefined,
			});
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
						children={(field) => (
							<AmountField
								value={field.state.value}
								symbol={symbol}
								remaining={max}
								label="Up to"
								isPending={isPending}
								onBlur={field.handleBlur}
								onChange={(next) => field.handleChange(next)}
							/>
						)}
					/>

					<form.Field
						name="paidAt"
						children={(field) => (
							<PaidAtField
								value={field.state.value ?? ""}
								isPending={isPending}
								onChange={(next) => field.handleChange(next)}
							/>
						)}
					/>
				</div>

				<form.Field
					name="transactionId"
					children={(field) => (
						<TransactionIdField
							value={field.state.value}
							isPending={isPending}
							onBlur={field.handleBlur}
							onChange={(next) => field.handleChange(next)}
						/>
					)}
				/>

				<form.Subscribe
					selector={(state) => state}
					children={(state) => (
						<SubmitActions
							isPending={isPending}
							isDirty={state.isDirty}
							canSubmit={state.canSubmit}
							onReset={() => form.reset()}
							label="Save Changes"
						/>
					)}
				/>
			</FieldGroup>
		</form>
	);
}
