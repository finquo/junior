"use client";

import { useMutation } from "@tanstack/react-query";
import { GripIcon, PenIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { sileo as toast } from "sileo";
import {
	Sortable,
	SortableItem,
	SortableItemHandle,
} from "@/components/reui/sortable";
import { Button } from "@/components/ui/button";
import {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemGroup,
	ItemTitle,
} from "@/components/ui/item";
import { api, refetchAPIs } from "@/hooks/api";
import type { API_Returns } from "@/lib/api";
import { VideoDeleteButton } from "../../_components/content-actions";
import { VideoForm } from "../../_components/video-form";

type VideoRecord = API_Returns["core"]["video"]["list"][number];

export function VideoOrderList({
	courseId,
	moduleId,
	videos,
	sortable = true,
}: {
	courseId: string;
	moduleId: string;
	videos: VideoRecord[];
	sortable?: boolean;
}) {
	const initialIds = videos.map((video) => video.id);
	const initialKey = initialIds.join("|");
	const [orderState, setOrderState] = useState<{
		key: string;
		ids: string[];
	} | null>(null);
	const items = orderState?.key === initialKey ? orderState.ids : initialIds;
	const videoById = new Map(videos.map((video) => [video.id, video]));

	const { mutateAsync: updateOrder } = useMutation(
		api.core.video.reorder.mutationOptions({
			onSuccess: () => {
				refetchAPIs([
					api.core.video.list.queryKey({
						input: { course: courseId, module: moduleId },
					}),
				]);
				refetchAPIs([
					api.core.module.get.queryKey({ input: { id: moduleId } }),
				]);
				toast.success({ title: "Video order updated" });
			},
			onError: (error) => {
				toast.error({ title: error.message || "Failed to update video order" });
			},
		}),
	);

	const handleValueChange = async (newIds: string[]) => {
		setOrderState({ key: initialKey, ids: newIds });
		try {
			await updateOrder({ module: moduleId, videos: newIds });
		} catch {
			setOrderState(null);
		}
	};

	if (!sortable) {
		return (
			<ItemGroup>
				{videos.map((video) => (
					<Item key={video.id} variant="outline">
						<ItemContent>
							<ItemTitle>
								<Button variant="link" asChild className="h-auto p-0">
									<Link href={`/videos/${video.id}` as "/"}>{video.name}</Link>
								</Button>
							</ItemTitle>
							<ItemDescription>{video.description}</ItemDescription>
						</ItemContent>
					</Item>
				))}
			</ItemGroup>
		);
	}

	return (
		<Sortable
			value={items}
			onValueChange={handleValueChange}
			getItemValue={(id) => id}
			strategy="vertical"
			className="space-y-3"
		>
			{items.map((videoId) => {
				const video = videoById.get(videoId);
				if (!video) return null;

				return (
					<SortableItem key={videoId} value={videoId}>
						<Item variant="outline">
							<SortableItemHandle className="opacity-40">
								<GripIcon />
							</SortableItemHandle>
							<ItemContent>
								<ItemTitle>
									<Button variant="link" asChild className="h-auto p-0">
										<Link href={`/videos/${video.id}` as "/"}>
											{video.name}
										</Link>
									</Button>
								</ItemTitle>
								<ItemDescription>{video.description}</ItemDescription>
							</ItemContent>
							<ItemActions>
								<ModuleVideoActions
									courseId={courseId}
									moduleId={moduleId}
									video={video}
								/>
							</ItemActions>
						</Item>
					</SortableItem>
				);
			})}
		</Sortable>
	);
}

function ModuleVideoActions({
	courseId,
	moduleId,
	video,
}: {
	courseId: string;
	moduleId: string;
	video: VideoRecord;
}) {
	return (
		<>
			<VideoForm courseId={courseId} moduleId={moduleId} video={video}>
				<Button variant="ghost" size="icon-sm">
					<PenIcon />
				</Button>
			</VideoForm>
			<VideoDeleteButton
				videoId={video.id}
				courseId={courseId}
				moduleId={moduleId}
				name={video.name}
			/>
		</>
	);
}
