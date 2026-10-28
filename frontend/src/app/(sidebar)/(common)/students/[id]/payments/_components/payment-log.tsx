"use client";

import { useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { BanknoteIcon, Trash2Icon } from "lucide-react";
import { sileo as toast } from "sileo";
import { getCurrencySymbol, getRelateTime } from "utils";
import { CopyButton } from "@/components/copy";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemGroup,
	ItemMedia,
	ItemTitle,
} from "@/components/ui/item";
import { api, refetchAPIs } from "@/hooks/api";
import type { API_Returns } from "@/lib/api";

type PaymentRecord = API_Returns["core"]["student"]["getPayments"][number];

function PaymentLogItem({
	id,
	payment,
}: {
	id: string;
	payment: PaymentRecord;
}) {
	const { mutate, isPending } = useMutation(
		api.core.student.deletePayment.mutationOptions({
			onSuccess: () => {
				refetchAPIs([
					api.core.student.get.queryKey({ input: { id } }),
					api.core.student.getPayments.queryKey({ input: { id } }),
				]);
				toast.success({
					title: "Payment removed and remaining amount restored",
				});
			},
		}),
	);

	return (
		<Item variant="outline">
			<ItemMedia variant="icon">
				<BanknoteIcon />
			</ItemMedia>
			<ItemContent>
				<ItemTitle>
					{getCurrencySymbol(payment.currency)}
					{payment.amount}
				</ItemTitle>
				<ItemDescription>
					{payment.paidAt
						? format(new Date(payment.paidAt), "MMM d, yyyy")
						: null}
					{payment.paidAt && payment.createdAt
						? ` · recorded ${getRelateTime(new Date(payment.createdAt))} ago`
						: null}
				</ItemDescription>
			</ItemContent>
			<ItemActions>
				{payment.transactionId && (
					<ButtonGroup>
						<CopyButton
							text={() => payment.transactionId ?? ""}
							label="Transaction ID"
						/>
					</ButtonGroup>
				)}
				<Button
					variant="destructive"
					size="icon-sm"
					onClick={() => mutate({ id: payment.id })}
					disabled={isPending}
				>
					<Trash2Icon />
				</Button>
			</ItemActions>
		</Item>
	);
}

export function PaymentLog({
	id,
	payments,
}: {
	id: string;
	payments: PaymentRecord[];
}) {
	if (payments.length === 0) {
		return (
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<BanknoteIcon />
					</EmptyMedia>
					<EmptyTitle>No payments recorded</EmptyTitle>
					<EmptyDescription>
						Payments recorded for this student will show up here.
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		);
	}

	return (
		<ItemGroup>
			{payments.map((payment) => (
				<PaymentLogItem key={payment.id} id={id} payment={payment} />
			))}
		</ItemGroup>
	);
}
