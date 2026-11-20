"use client";

import {
	LogOutIcon,
	MessageSquarePlusIcon,
	MoonIcon,
	PenIcon,
	SunIcon,
	UserPenIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { sileo as toast } from "sileo";
import { FeedbackDialog } from "@/components/custom/feedback-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuActionItem,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient, useAuth } from "@/hooks/auth";

export function StudentNavUser() {
	const { data: user, impersonation } = useAuth();
	const { resolvedTheme, setTheme } = useTheme();

	if (!user) return null;

	const themeLabel = resolvedTheme === "light" ? "Dark theme" : "Light theme";
	const ThemeIcon = resolvedTheme === "light" ? MoonIcon : SunIcon;
	const sessionLabel = impersonation ? "Stop Impersonating" : "Log Out";
	const fallback = user.name.trim().charAt(0).toUpperCase() || "U";

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button size={"lg"} className="h-13 rounded-3xl">
					<Avatar size="sm">
						<AvatarImage src={user.image} alt={user.name} />
						<AvatarFallback>{fallback}</AvatarFallback>
					</Avatar>
					{user.name}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuItem asChild>
					<Link href="/student/edit">
						<UserPenIcon />
						Edit Profile
					</Link>
				</DropdownMenuItem>
				<DropdownMenuItem asChild>
					<Link href="/student/edit/account">
						<PenIcon />
						Edit Account
					</Link>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					onSelect={() =>
						setTheme(resolvedTheme === "light" ? "dark" : "light")
					}
				>
					<ThemeIcon />
					{themeLabel}
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					onSelect={() => {
						void (async () =>
							impersonation
								? await authClient.admin.stopImpersonating(
										{},
										{
											throw: true,
											onSuccess: () => {
												toast.success({
													title: "You’re back to your role",
												});
											},
										},
									)
								: await authClient.signOut(
										{},
										{
											throw: true,
											onSuccess: () => {
												toast.success({
													title: "You’re signed out",
												});
											},
										},
									))();
					}}
				>
					<LogOutIcon />
					{sessionLabel}
				</DropdownMenuItem>
				<FeedbackDialog type="dashboard">
					<DropdownMenuActionItem onSelect={(event) => event.preventDefault()}>
						<MessageSquarePlusIcon />
						Send feedback
					</DropdownMenuActionItem>
				</FeedbackDialog>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
