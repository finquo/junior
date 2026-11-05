"use client";

import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useState } from "react";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from "@/components/ui/input-group";

export const PasswordField = ({
	id,
	value,
	onChange,
	autoComplete,
	defaultVisible = false,
}: {
	id: string;
	value: string;
	onChange: (value: string) => void;
	autoComplete: "current-password" | "new-password";
	defaultVisible?: boolean;
}) => {
	const [visible, setVisible] = useState(defaultVisible);

	const Icon = visible ? EyeOffIcon : EyeIcon;
	const label = visible ? "Hide password" : "Show password";

	return (
		<InputGroup>
			<InputGroupInput
				id={id}
				type={visible ? "text" : "password"}
				autoComplete={autoComplete}
				placeholder="super-secret"
				value={value}
				onChange={(e) => onChange(e.target.value)}
			/>
			<InputGroupAddon align="inline-end">
				<InputGroupButton
					size="icon-xs"
					aria-label={label}
					onClick={() => setVisible((v) => !v)}
				>
					<Icon />
				</InputGroupButton>
			</InputGroupAddon>
		</InputGroup>
	);
};
