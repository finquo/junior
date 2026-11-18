"use client";

import {
	KeyRoundIcon,
	MoreHorizontalIcon,
	PenIcon,
	TrashIcon,
	UserIcon,
	UserXIcon,
	VenetianMaskIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { sileo as toast } from "sileo";
import { EditRoleDrawer } from "@/components/custom/edit-role-drawer";
import { ResetPasswordForm } from "@/components/custom/reset-password-form";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuActionItem,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import { ImpersonateButton } from "@/hooks/admin";
import { api, refetchAPIs } from "@/hooks/api";
import { authClient } from "@/hooks/auth";
import { MutationButton } from "@/hooks/button";
import type { API_Returns } from "@/lib/api";
import { snakeToTitleCase } from "@/lib/utils";

type UserRecord = API_Returns["admin"]["getUsers"][number];

function DeleteUserDialog({
	user,
	children,
}: {
	user: UserRecord;
	children: React.ReactElement;
}) {
	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete {user.name}?</AlertDialogTitle>
					<AlertDialogDescription>
						This will permanently remove the user account and cannot be undone.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<MutationButton
						api={{
							mutationFn: async () => {
								const { error } = await authClient.admin.removeUser({
									userId: user.id,
								});

								if (error) {
									throw new Error(error.message || "Failed to delete user");
								}
							},
						}}
						onSuccess={() => {
							refetchAPIs([api.admin.getUsers.queryKey({ input: {} })]);
							toast.success({ title: `Deleted ${user.name}` });
						}}
						mutate={(mutate) => (
							<AlertDialogAction
								variant="destructive"
								onClick={() => mutate()}
							>
								<TrashIcon />
								Delete
							</AlertDialogAction>
						)}
						isPending={
							<AlertDialogAction variant="destructive" disabled>
								<Spinner />
								Deleting
							</AlertDialogAction>
						}
					/>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

function ResetPasswordDialog({
	user,
	children,
}: {
	user: UserRecord;
	children: React.ReactElement;
}) {
	const [open, setOpen] = useState(false);

	return (
		<AlertDialog open={open} onOpenChange={setOpen}>
			<AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
			<AlertDialogContent>
				<MutationButton
					api={{
						mutationFn: async (newPassword: string) => {
							const { error } = await authClient.admin.setUserPassword({
								userId: user.id,
								newPassword,
							});

							if (error) {
								throw new Error(error.message || "Failed to reset password");
							}
						},
					}}
					onSuccess={() => {
						toast.success({ title: `Password reset for ${user.name}` });
						setOpen(false);
					}}
					mutate={(mutate) => (
						<ResetPasswordForm mutate={mutate} userName={user.name} />
					)}
				/>
			</AlertDialogContent>
		</AlertDialog>
	);
}

export function UserActions({ user }: { user: UserRecord }) {
	const roleProfilePath =
		user.role === "teacher"
			? `/teachers/${user.id}`
			: user.role === "student"
				? `/students/${user.id}`
				: user.role === "scheduler"
					? `/schedulers/${user.id}`
					: null;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" size="icon-sm">
					<MoreHorizontalIcon />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				{roleProfilePath && (
					<DropdownMenuItem asChild>
						<Link href={roleProfilePath as "/"}>
							<UserIcon />
							View {snakeToTitleCase(user.role)} Profile
						</Link>
					</DropdownMenuItem>
				)}
				<EditRoleDrawer user={user}>
					<DropdownMenuActionItem>
						<PenIcon />
						Edit Role
					</DropdownMenuActionItem>
				</EditRoleDrawer>
				<ImpersonateButton userId={user.id} asChild>
					<DropdownMenuActionItem>
						<VenetianMaskIcon />
						Impersonate
					</DropdownMenuActionItem>
				</ImpersonateButton>
				<MutationButton
					api={{
						mutationFn: async () => {
							const { error } = await authClient.admin.revokeUserSessions({
								userId: user.id,
							});

							if (error) {
								throw new Error(error.message || "Failed to revoke sessions");
							}
						},
					}}
					onSuccess={() => {
						toast.success({
							title: `Revoked active sessions for ${user.name}`,
						});
					}}
					isPending={
						<DropdownMenuActionItem disabled>
							<Spinner />
							Revoking Sessions...
						</DropdownMenuActionItem>
					}
					mutate={(mutate) => (
						<DropdownMenuActionItem onClick={() => mutate()}>
							<UserXIcon />
							Revoke Sessions
						</DropdownMenuActionItem>
					)}
				/>
				<ResetPasswordDialog user={user}>
					<DropdownMenuActionItem>
						<KeyRoundIcon />
						Reset Password
					</DropdownMenuActionItem>
				</ResetPasswordDialog>
				<DropdownMenuSeparator />
				<DeleteUserDialog user={user}>
					<DropdownMenuActionItem variant="destructive">
						<TrashIcon />
						Delete User
					</DropdownMenuActionItem>
				</DeleteUserDialog>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
