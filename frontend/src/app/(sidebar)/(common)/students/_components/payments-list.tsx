"use client";

import { useQuery } from "@tanstack/react-query";
import { PaymentMethodLabels } from "backend/config";
import { format } from "date-fns";
import { BanknoteIcon } from "lucide-react";
import { getCurrencySymbol } from "utils";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import {
	Item,
	ItemContent,
	ItemDescription,
	ItemGroup,
	ItemMedia,
	ItemTitle,
} from "@/components/ui/item";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/hooks/api";

export function StudentPaymentsList({ studentId }: { studentId: string }) {
	const { data = [], isPending } = useQuery(
		api.core.payment.list.queryOptions({ input: { studentId } }),
	);

	if (isPending) {
		return <Skeleton className="h-16 w-full" />;
	}

	if (data.length === 0) {
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
			{data.map((payment) => (
				<Item key={payment.id} variant="outline">
					<ItemMedia variant="icon">
						<BanknoteIcon />
					</ItemMedia>
					<ItemContent>
						<ItemTitle>
							{getCurrencySymbol(payment.currency)}
							{payment.amount.toLocaleString()}
						</ItemTitle>
						<ItemDescription>
							{payment.paidAt
								? format(new Date(payment.paidAt), "MMM d, yyyy")
								: "Not recorded"}
							{" · "}
							{PaymentMethodLabels[payment.paymentMethod]}
						</ItemDescription>
					</ItemContent>
				</Item>
			))}
		</ItemGroup>
	);
}
