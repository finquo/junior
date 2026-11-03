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
	AlertDialogMedia,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
	DropdownMenu,
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

export function UserActions({ user }: { user: UserRecord }) {
	const [resetOpen, setResetOpen] = useState(false);

	const roleProfilePath =
		user.role === "teacher"
			? `/teachers/${user.id}`
			: user.role === "student"
				? `/students/${user.id}`
				: user.role === "scheduler"
					? `/schedulers/${user.id}`
					: null;

	return (
		<ButtonGroup>
			<EditRoleDrawer user={user}>
				<Button variant="outline" size="icon-sm" aria-label="Edit role">
					<PenIcon />
				</Button>
			</EditRoleDrawer>

			<AlertDialog>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="outline" size="icon-sm">
							<MoreHorizontalIcon />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem asChild>
							<ImpersonateButton userId={user.id} asChild>
								<Button variant="outline" size="sm">
									<VenetianMaskIcon />
									Impersonate
								</Button>
							</ImpersonateButton>
						</DropdownMenuItem>
						{roleProfilePath && (
							<DropdownMenuItem asChild>
								<Button variant="link" asChild>
									<Link href={roleProfilePath as "/"}>
										<UserIcon />
										View {snakeToTitleCase(user.role)} Profile
									</Link>
								</Button>
							</DropdownMenuItem>
						)}
						<MutationButton
							api={{
								mutationFn: async () => {
									const { error } = await authClient.admin.revokeUserSessions({
										userId: user.id,
									});

									if (error) {
										throw new Error(
											error.message || "Failed to revoke sessions",
										);
									}
								},
							}}
							onSuccess={() => {
								toast.success({
									title: `Revoked active sessions for ${user.name}`,
								});
							}}
							isPending={
								<DropdownMenuItem disabled>
									<Spinner />
									Revoking Sessions...
								</DropdownMenuItem>
							}
							mutate={(mutate) => (
								<DropdownMenuItem onSelect={() => mutate()}>
									<UserXIcon />
									Revoke Sessions
								</DropdownMenuItem>
							)}
						/>
						<DropdownMenuItem onSelect={() => setResetOpen(true)}>
							<KeyRoundIcon />
							Reset Password
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<AlertDialogTrigger asChild>
							<DropdownMenuItem variant="destructive">
								<TrashIcon />
								Delete User
							</DropdownMenuItem>
						</AlertDialogTrigger>
					</DropdownMenuContent>
				</DropdownMenu>

				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogMedia>
							<TrashIcon />
						</AlertDialogMedia>
						<AlertDialogTitle>Delete {user.name}?</AlertDialogTitle>
						<AlertDialogDescription>
							This will permanently remove the user account and cannot be
							undone.
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
						/>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
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
							setResetOpen(false);
						}}
						mutate={(mutate) => (
							<ResetPasswordForm mutate={mutate} userName={user.name} />
						)}
					/>
				</AlertDialogContent>
			</AlertDialog>
		</ButtonGroup>
	);
}
