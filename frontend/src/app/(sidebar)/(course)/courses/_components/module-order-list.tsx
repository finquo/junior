"use client";

import { useMutation } from "@tanstack/react-query";
import { GripIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { sileo as toast } from "sileo";
import {
	Sortable,
	SortableItem,
	SortableItemHandle,
} from "@/components/reui/sortable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemTitle,
} from "@/components/ui/item";
import { api, refetchAPIs } from "@/hooks/api";
import type { API_Returns } from "@/lib/api";

type ModuleRecord = API_Returns["core"]["module"]["list"][number];

export function ModuleOrderList({
	courseId,
	modules,
}: {
	courseId: string;
	modules: ModuleRecord[];
}) {
	const initialIds = modules.map((module) => module.id);
	const initialKey = initialIds.join("|");
	const [orderState, setOrderState] = useState<{
		key: string;
		ids: string[];
	} | null>(null);
	const items = orderState?.key === initialKey ? orderState.ids : initialIds;
	const moduleById = new Map(modules.map((module) => [module.id, module]));

	const { mutateAsync: updateOrder } = useMutation(
		api.core.module.reorder.mutationOptions({
			onSuccess: () => {
				refetchAPIs([
					api.core.module.list.queryKey({ input: { course: courseId } }),
					api.core.course.get.queryKey({ input: { id: courseId } }),
				]);
				toast.success({ title: "Module order updated" });
			},
			onError: (error) => {
				toast.error({
					title: error.message || "Failed to update module order",
				});
			},
		}),
	);

	const handleValueChange = async (newIds: string[]) => {
		setOrderState({ key: initialKey, ids: newIds });
		try {
			await updateOrder({ course: courseId, modules: newIds });
		} catch {
			setOrderState(null);
		}
	};

	return (
		<Sortable
			value={items}
			onValueChange={handleValueChange}
			getItemValue={(id) => id}
			strategy="vertical"
			className="space-y-3"
		>
			{items.map((moduleId) => {
				const module = moduleById.get(moduleId);
				if (!module) return null;

				return (
					<SortableItem key={moduleId} value={moduleId}>
						<Item variant="outline">
							<SortableItemHandle className="opacity-40">
								<GripIcon />
							</SortableItemHandle>
							<ItemContent>
								<ItemTitle>
									<Button variant="link" asChild className="h-auto p-0">
										<Link href={`/modules/${module.id}` as "/"}>
											{module.name}
										</Link>
									</Button>
								</ItemTitle>
								<ItemDescription>{module.description}</ItemDescription>
							</ItemContent>
							<ItemActions>
								<Badge variant="outline">{module.videoCount} videos</Badge>
								<Badge variant="secondary">
									{module.quiz?.length ?? 0} quiz
								</Badge>
							</ItemActions>
						</Item>
					</SortableItem>
				);
			})}
		</Sortable>
	);
}
