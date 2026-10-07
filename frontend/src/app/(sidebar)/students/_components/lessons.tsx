"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { BookOpenIcon, GripVerticalIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { sileo as toast } from "sileo";
import Loader from "@/components/loader";
import {
	Frame,
	FrameHeader,
	FramePanel,
	FrameTitle,
} from "@/components/reui/frame";
import {
	Sortable,
	SortableItem,
	SortableItemHandle,
} from "@/components/reui/sortable";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "@/components/ui/drawer";
import {
	Item,
	ItemActions,
	ItemContent,
	ItemMedia,
	ItemTitle,
} from "@/components/ui/item";
import { api, queryClient } from "@/hooks/api";
import { FetchLesson } from "@/hooks/lesson";
import { LessonSelector } from "./selector";

export function StudentLessons({ studentId }: { studentId: string }) {
	const { data: studentLessonIds = [], isPending } = useQuery(
		api.core.getStudentLessons.queryOptions({
			input: { id: studentId },
		}),
	);

	const [orderedIds, setOrderedIds] = useState<string[] | null>(null);
	const [selectedLessonId, setSelectedLessonId] = useState<string>(null);
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);

	const items = orderedIds ?? studentLessonIds;

	const { mutateAsync: updateStudentLessons } = useMutation(
		api.scheduler.updateStudentLessons.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries();
				toast.success({ title: "Lesson order updated" });
			},
			onError: (err) => {
				toast.error({
					title: err.message || "Failed to update lesson order",
				});
			},
		}),
	);

	const handleValueChange = async (newIds: string[]) => {
		setOrderedIds(newIds);
		await updateStudentLessons({
			id: studentId,
			lessons: newIds,
		});
	};

	const handleAddLesson = async () => {
		if (!selectedLessonId) return;
		const newIds = [...items, selectedLessonId];
		setOrderedIds(newIds);
		setSelectedLessonId("");
		setIsDrawerOpen(false);
		await updateStudentLessons({
			id: studentId,
			lessons: newIds,
		});
	};

	if (isPending) {
		return <Loader />;
	}

	return (
		<Frame>
			<FrameHeader className="flex flex-row items-center justify-between">
				<FrameTitle>Enrolled Lessons</FrameTitle>
				<Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
					<DrawerTrigger
						render={
							<Button variant="outline" size="sm">
								<PlusIcon />
								Add Lesson
							</Button>
						}
					/>
					<DrawerContent>
						<DrawerHeader>
							<DrawerTitle>Add Lesson</DrawerTitle>
						</DrawerHeader>
						<LessonSelector
							enrolledLessonIds={items}
							value={selectedLessonId}
							onValueChange={setSelectedLessonId}
						/>
						<DrawerFooter>
							<Button disabled={!selectedLessonId} onClick={handleAddLesson}>
								<PlusIcon />
								Add
							</Button>
							<DrawerClose render={<Button variant="outline" />}>
								Close
							</DrawerClose>
						</DrawerFooter>
					</DrawerContent>
				</Drawer>
			</FrameHeader>

			<FramePanel>
				{items.length === 0 ? (
					<Alert>
						<BookOpenIcon />
						<AlertTitle>No lessons assigned</AlertTitle>
					</Alert>
				) : (
					<Sortable
						value={items}
						onValueChange={handleValueChange}
						getItemValue={(id) => id}
						strategy="vertical"
					>
						{items.map((lessonId, index) => (
							<SortableItem key={lessonId} value={lessonId}>
								<Item variant="outline">
									<SortableItemHandle>
										<GripVerticalIcon />
									</SortableItemHandle>
									<ItemMedia>
										<BookOpenIcon />
									</ItemMedia>
									<FetchLesson
										id={lessonId}
										isPending={
											<ItemContent>
												<ItemTitle>#{index + 1} Loading...</ItemTitle>
											</ItemContent>
										}
										notFound={
											<ItemContent>
												<ItemTitle>#{index + 1} Lesson not found</ItemTitle>
											</ItemContent>
										}
									>
										{(lesson) => (
											<>
												<ItemContent>
													<ItemTitle>
														#{index + 1} {lesson.name}
													</ItemTitle>
												</ItemContent>
												<ItemActions>
													{lesson.language && (
														<Badge variant="secondary">{lesson.language}</Badge>
													)}
													{lesson.period && (
														<Badge variant="outline">
															{String(lesson.period)}
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
				)}
			</FramePanel>
		</Frame>
	);
}

export default StudentLessons;
