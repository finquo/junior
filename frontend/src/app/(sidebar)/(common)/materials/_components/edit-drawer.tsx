"use client";

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
} from "@/components/ui/drawer";
import { api, refetchAPIs } from "@/hooks/api";
import type { API_Returns } from "@/lib/api";
import { MaterialForm } from "./material-form";

type MaterialListItem = API_Returns["core"]["material"]["list"][number];

export function EditMaterialDrawer({
	material,
	children,
}: {
	material: MaterialListItem;
	children: React.ReactElement;
}) {
	const { mutateAsync, isPending } = useMutation(
		api.core.material.update.mutationOptions({
			onSuccess: () => {
				refetchAPIs([
					api.core.material.list.queryKey(),
					api.core.material.get.queryKey({ input: { id: material.id } }),
				]);
				toast.success({ title: "Material updated" });
			},
			onError: (err: { message?: string }) => {
				toast.error({ title: err.message || "Failed to update material" });
			},
		}),
	);

	return (
		<Drawer>
			{children}
			<DrawerContent>
				<DrawerHeader>
					<DrawerTitle>Edit Material</DrawerTitle>
					<DrawerDescription>{material.name}</DrawerDescription>
				</DrawerHeader>
				<DrawerInner>
					<MaterialForm
						material={material}
						isPending={isPending}
						onSubmit={async (value) => {
							await mutateAsync({ id: material.id, ...value });
						}}
					/>
				</DrawerInner>
				<DrawerFooter>
					<DrawerClose asChild>
						<Button variant="outline">Close</Button>
					</DrawerClose>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
}
