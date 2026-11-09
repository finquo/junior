import { z } from "zod";

export const PaymentMethodLabels = {
	cash: "Cash",
	bank_transfer: "Bank Transfer",
	upi: "UPI",
	card: "Card",
	cheque: "Cheque",
} as const;

export type PaymentMethod = keyof typeof PaymentMethodLabels;

export const PaymentMethods = Object.keys(PaymentMethodLabels) as [
	PaymentMethod,
	...PaymentMethod[],
];

export const PaymentMethodZod = z.enum(PaymentMethods);
