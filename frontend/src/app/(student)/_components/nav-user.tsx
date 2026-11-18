"use client";

import {
	LogOutIcon,
	MessageSquarePlusIcon,
	MoonIcon,
	PenIcon,
	SunIcon,
	UserPenIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useState } from "react";
import { sileo as toast } from "sileo";
import { Avatar } from "@/components/arc/avatar/avatar";
import { DropdownMenu } from "@/components/arc/dropdown-menu/dropdown-menu";
import { FeedbackDialog } from "@/components/custom/feedback-dialog";
import { authClient, useAuth } from "@/hooks/auth";

export function StudentNavUser() {
	const router = useRouter();
	const { data: user, impersonation } = useAuth();
	const { resolvedTheme, setTheme } = useTheme();
	const [feedbackOpen, setFeedbackOpen] = useState(false);

	if (!user) return null;

	return (
		<>
			<DropdownMenu
				label={user.name}
				icon={
					<Avatar name={user.name} src={user.image ?? undefined} size="sm" />
				}
				items={[
					{
						label: "Edit Profile",
						icon: <UserPenIcon />,
						onSelect: () => router.push("/student/edit"),
					},
					{
						label: "Edit Account",
						icon: <PenIcon />,
						onSelect: () => router.push("/student/edit/account"),
					},
					{
						label: "Send feedback",
						icon: <MessageSquarePlusIcon />,
						separatorBefore: true,
						onSelect: () => setFeedbackOpen(true),
					},
					{
						label: resolvedTheme === "light" ? "Dark theme" : "Light theme",
						icon: resolvedTheme === "light" ? <MoonIcon /> : <SunIcon />,
						onSelect: () =>
							setTheme(resolvedTheme === "light" ? "dark" : "light"),
					},
					{
						label: impersonation ? "Stop Impersonating" : "Log Out",
						icon: <LogOutIcon />,
						separatorBefore: true,
						onSelect: () => {
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
						},
					},
				]}
			/>
			<FeedbackDialog
				type="dashboard"
				open={feedbackOpen}
				onOpenChange={setFeedbackOpen}
			/>
		</>
	);
}
