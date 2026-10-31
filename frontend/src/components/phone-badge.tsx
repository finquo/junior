"use client";

import type { VariantProps } from "class-variance-authority";
import { CheckIcon, CopyIcon, PhoneIcon } from "lucide-react";
import { sileo as toast } from "sileo";
import { triedAsync } from "utils";
import { Badge, type badgeVariants } from "@/components/ui/badge";
import { useFeedback } from "@/hooks/utils";

export interface PhoneNumberBadgeProps {
	phoneNumber?: string | null;
	className?: string;
	variant?: VariantProps<typeof badgeVariants>["variant"];
}

export function PhoneNumberBadge({
	phoneNumber,
	className,
	variant = "secondary",
}: PhoneNumberBadgeProps) {
	const { isPending, mutate } = useFeedback(() => {
		if (!phoneNumber) return;
		triedAsync(navigator.clipboard.writeText(phoneNumber));
		toast.success({
			title: "Phone number copied",
			description: phoneNumber,
		});
	}, 2000);

	if (!phoneNumber) return null;

	const handleCopy = (e: React.MouseEvent | React.KeyboardEvent) => {
		e.stopPropagation();
		mutate();
	};

	return (
		<Badge
			variant={variant}
			role="button"
			tabIndex={0}
			title="Click to copy phone number"
			className="cursor-pointer select-none gap-1.5 transition-all hover:bg-accent hover:text-accent-foreground active:scale-95"
			onClick={handleCopy}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					handleCopy(e);
				}
			}}
		>
			{isPending ? (
				<CheckIcon className="size-3 text-emerald-600" />
			) : (
				<PhoneIcon className="size-3" />
			)}
			<span>{phoneNumber}</span>
			<CopyIcon className="size-2.5 opacity-60" />
		</Badge>
	);
}

export const PhoneBadge = PhoneNumberBadge;
