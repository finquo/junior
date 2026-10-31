"use client";

import {
	MailIcon,
	MessageCircleIcon,
	PhoneCallIcon,
	PhoneIcon,
} from "lucide-react";
import { getWhatsappLink } from "utils";
import { Button, type ButtonType } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface UserContactDropdownProps {
	user?: {
		name?: string | null;
		email?: string | null;
		phoneNumber?: string | null;
	} | null;
	size?: ButtonType["size"];
	variant?: ButtonType["variant"];
	align?: "start" | "end" | "center";
}

export function UserContactDropdown({
	user,
	size = "sm",
	variant = "outline",
	align = "end",
}: UserContactDropdownProps) {
	const phone = user?.phoneNumber?.trim();
	const email = user?.email?.trim();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant={variant} size={size}>
					<PhoneCallIcon />
					Contact
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align={align}>
				<DropdownMenuLabel>Contact</DropdownMenuLabel>
				{phone ? (
					<>
						<DropdownMenuItem asChild>
							<a
								href={getWhatsappLink(phone)}
								target="_blank"
								rel="noopener noreferrer"
							>
								<MessageCircleIcon />
								WhatsApp ({phone})
							</a>
						</DropdownMenuItem>
						<DropdownMenuItem asChild>
							<a href={`tel:${phone}`}>
								<PhoneIcon />
								Call ({phone})
							</a>
						</DropdownMenuItem>
					</>
				) : (
					<DropdownMenuItem disabled>
						<PhoneIcon />
						No phone number
					</DropdownMenuItem>
				)}
				<DropdownMenuSeparator />
				{email ? (
					<DropdownMenuItem asChild>
						<a href={`mailto:${email}`}>
							<MailIcon />
							Email ({email})
						</a>
					</DropdownMenuItem>
				) : (
					<DropdownMenuItem disabled>
						<MailIcon />
						No email address
					</DropdownMenuItem>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
