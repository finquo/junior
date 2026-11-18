import { CheckIcon, CopyIcon } from "lucide-react";
import { Slot } from "radix-ui";
import { cloneElement, isValidElement } from "react";
import { triedAsync } from "utils";
import { useFeedback } from "@/hooks/utils";
import { Button, type ButtonType } from "./ui/button";

export const CopyButton = ({
	asChild,
	children,
	text,
	label,
	showText,
	...props
}: {
	asChild?: boolean;
	children?: React.ReactElement;
	text: () => string;
	label: string;
	showText?: boolean;
} & Omit<ButtonType, "onClick" | "children" | "asChild">) => {
	const { isPending, mutate } = useFeedback(() => {
		triedAsync(navigator.clipboard.writeText(text()));
	}, 3000);

	const content = isPending ? (
		<>
			<CheckIcon />
			{showText && `Copied ${label}`}
			<span className="sr-only">Copied {label}</span>
		</>
	) : (
		<>
			<CopyIcon />
			{showText && `Copy ${label}`}
			<span className="sr-only">Copy {label}</span>
		</>
	);

	if (asChild && isValidElement(children)) {
		return (
			<Slot.Root onClick={mutate} {...props}>
				{cloneElement(children, undefined, content)}
			</Slot.Root>
		);
	}

	return (
		<Button onClick={mutate} {...props}>
			{content}
		</Button>
	);
};
