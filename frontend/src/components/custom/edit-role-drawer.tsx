"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { sileo as toast } from "sileo";
import { Button } from "@/components/ui/button";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerInner,
	DrawerTitle,
	DrawerTrigger,
} from "@/components/ui/drawer";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { api, queryClient } from "@/hooks/api";
import type { API_Returns } from "@/lib/api";
import { rolesObject } from "@/lib/role";

type UserRecord = API_Returns["admin"]["getUsers"][number];

export function EditRoleDrawer({
	user,
	children,
}: {
	user: UserRecord;
	children: React.ReactElement;
}) {
	const { mutateAsync, isPending } = useMutation(
		api.admin.promote.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries();
				toast.success({ title: "Role updated successfully" });
			},
		}),
	);

	const form = useForm({
		defaultValues: {
			role: user.role ?? "user",
		},
		onSubmit: async ({ value }) => {
			await mutateAsync({
				id: user.id,
				role: value.role,
			});
		},
	});

	return (
		<Drawer>
			<DrawerTrigger asChild>{children}</DrawerTrigger>
			<DrawerContent>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						form.handleSubmit();
					}}
				>
					<DrawerHeader>
						<DrawerTitle>Edit User Role</DrawerTitle>
						<DrawerDescription>
							Promote or reassign role for {user.name} ({user.email})
						</DrawerDescription>
					</DrawerHeader>
					<DrawerInner>
						<FieldGroup>
							<form.Field
								name="role"
								children={(field) => (
									<Field>
										<FieldLabel>Role</FieldLabel>
										<Select
											items={rolesObject}
											value={field.state.value}
											disabled={isPending}
											onValueChange={(r) => {
												if (r) field.handleChange(r);
											}}
										>
											<SelectTrigger>
												<SelectValue placeholder="Select role" />
											</SelectTrigger>
											<SelectContent>
												<SelectGroup>
													{rolesObject.map((item) => (
														<SelectItem key={item.value} value={item.value}>
															{item.label}
														</SelectItem>
													))}
												</SelectGroup>
											</SelectContent>
										</Select>
									</Field>
								)}
							/>
						</FieldGroup>
					</DrawerInner>
					<DrawerFooter>
						<Button type="submit" disabled={isPending}>
							{isPending && <Spinner />}
							Submit
						</Button>
						<DrawerClose asChild>
							<Button variant="outline">Close</Button>
						</DrawerClose>
					</DrawerFooter>
				</form>
			</DrawerContent>
		</Drawer>
	);
}
