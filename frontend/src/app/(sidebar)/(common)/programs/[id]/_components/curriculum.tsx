"use client";

import { useMutation } from "@tanstack/react-query";
import { langFlag, langName } from "language-emoji";
import { BookOpenIcon, GripIcon } from "lucide-react";
import { useState } from "react";
import { sileo as toast } from "sileo";
import { formatTimeString } from "utils";
import {
	Sortable,
	SortableItem,
	SortableItemHandle,
} from "@/components/reui/sortable";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemTitle,
} from "@/components/ui/item";
import { api, refetchAPIs } from "@/hooks/api";
import { FetchLesson } from "@/hooks/lesson";
import type { API_Returns } from "@/lib/api";

type ProgramLesson = API_Returns["core"]["program"]["lessons"][number];

export function ProgramCurriculum({
	programId,
	lessons,
}: {
	programId: string;
	lessons: ProgramLesson[];
}) {
	const lessonIds = lessons.map((lesson) => lesson.id);

	const [orderedIds, setOrderedIds] = useState<string[] | null>(null);
	const items = orderedIds ?? lessonIds;

	const { mutateAsync: updateOrder } = useMutation(
		api.core.program.updateLessons.mutationOptions({
			onSuccess: () => {
				refetchAPIs([
					api.core.program.lessons.queryKey({ input: { id: programId } }),
					api.core.program.get.queryKey({ input: { id: programId } }),
				]);
				toast.success({ title: "Lesson order updated" });
			},
		}),
	);

	const handleValueChange = async (newIds: string[]) => {
		setOrderedIds(newIds);
		await updateOrder({ id: programId, lessons: newIds });
	};

	if (items.length === 0) {
		return (
			<Alert>
				<BookOpenIcon />
				<AlertTitle>No lessons in this program</AlertTitle>
			</Alert>
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
			{items.map((lessonId) => (
				<SortableItem key={lessonId} value={lessonId}>
					<Item variant="outline">
						<SortableItemHandle className="opacity-40">
							<GripIcon />
						</SortableItemHandle>
						<FetchLesson
							id={lessonId}
							isPending={
								<ItemContent>
									<ItemTitle>Loading...</ItemTitle>
								</ItemContent>
							}
							notFound={
								<ItemContent>
									<ItemTitle>Lesson not found</ItemTitle>
								</ItemContent>
							}
						>
							{(lesson) => (
								<>
									<ItemContent>
										<ItemTitle>{lesson.name}</ItemTitle>
										<ItemDescription>
											{lesson.description ?? "No description provided."}
										</ItemDescription>
									</ItemContent>
									<ItemContent>
										<Badge variant="secondary">
											{langFlag(lesson.language)} {langName(lesson.language)}
										</Badge>
									</ItemContent>
									<ItemActions>
										{lesson.period && (
											<Badge variant="outline">
												{formatTimeString(lesson.period)}
											</Badge>
										)}
									</ItemActions>
								</>
							)}
						</FetchLesson>
					</Item>
				</SortableItem>
			))}
		</Sortable>
	);
}

export default ProgramCurriculum;
