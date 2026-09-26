import { CheckIcon, CopyIcon } from "lucide-react";
import { triedAsync } from "utils";
import { useFeedback } from "@/hooks/utils";
import { Button, type ButtonType } from "./ui/button";

export const CopyButton = ({
	text,
	label,
	...props
}: { text: () => string; label: string } & Omit<ButtonType, "onClick">) => {
	const { isPending, mutate } = useFeedback(() => {
		triedAsync(navigator.clipboard.writeText(text()));
	}, 3000);

	if (isPending) {
		return (
			<Button {...props}>
				<CheckIcon />
				<span className="sr-only">Copied {label}</span>
			</Button>
		);
	}

	return (
		<Button {...props} onClick={mutate}>
			<CopyIcon />
			<span className="sr-only">Copy {label}</span>
		</Button>
	);
};
