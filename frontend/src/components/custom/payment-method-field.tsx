"use client";

import { PaymentMethodLabels } from "backend/config";
import { Field, FieldLabel } from "@/components/ui/field";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

export function PaymentMethodField({
	value,
	isPending,
	onChange,
}: {
	value: string | undefined;
	isPending: boolean;
	onChange: (value: string) => void;
}) {
	return (
		<Field>
			<FieldLabel htmlFor="paymentMethod">Payment Method</FieldLabel>
			<Select
				items={PaymentMethodLabels}
				value={value}
				onValueChange={(next) => next && onChange(next)}
				disabled={isPending}
			>
				<SelectTrigger id="paymentMethod" className="w-full min-w-[200px]">
					<SelectValue placeholder="Select payment method" />
				</SelectTrigger>
				<SelectContent>
					<SelectGroup>
						{Object.entries(PaymentMethodLabels).map(([method, label]) => (
							<SelectItem key={method} value={method}>
								{label}
							</SelectItem>
						))}
					</SelectGroup>
				</SelectContent>
			</Select>
		</Field>
	);
}
