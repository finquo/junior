"use client";

import { LogOutIcon, PenIcon, UserPenIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { sileo as toast } from "sileo";
import { Avatar } from "@/components/arc/avatar/avatar";
import { DropdownMenu } from "@/components/arc/dropdown-menu/dropdown-menu";
import { authClient, useAuth } from "@/hooks/auth";

export function StudentNavUser() {
	const router = useRouter();
	const { data: user, impersonation } = useAuth();

	if (!user) return null;

	return (
		<DropdownMenu
			label={user.name}
			icon={<Avatar name={user.name} src={user.image ?? undefined} size="sm" />}
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
	);
}
