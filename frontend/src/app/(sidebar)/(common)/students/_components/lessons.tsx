"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { langFlag, langName } from "language-emoji";
import { BookOpenIcon, GripIcon, ImportIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { sileo as toast } from "sileo";
import { formatTimeString } from "utils";
import Loader from "@/components/loader";
import {
	Frame,
	FrameActions,
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
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerInner,
	DrawerTitle,
	DrawerTrigger,
} from "@/components/ui/drawer";
import {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemTitle,
} from "@/components/ui/item";
import { Marker, MarkerContent } from "@/components/ui/marker";
import { api, queryClient } from "@/hooks/api";
import { FetchLesson } from "@/hooks/lesson";
import { LessonSelector } from "./selector";

export function StudentLessons({ studentId }: { studentId: string }) {
	const { data: studentLessonIds = [], isPending } = useQuery(
		api.core.student.getLessons.queryOptions({
			input: { id: studentId },
		}),
	);

	const [orderedIds, setOrderedIds] = useState<string[] | null>(null);
	const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);

	const items = orderedIds ?? studentLessonIds;

	const { mutateAsync: updateStudentLessons } = useMutation(
		api.core.student.updateLessons.mutationOptions({
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
			<FrameHeader>
				<FrameTitle>Enrolled Lessons</FrameTitle>
				<FrameActions>
					<Drawer>
						<DrawerTrigger
							render={
								<Button variant="outline">
									<PlusIcon />
									Add Lesson
								</Button>
							}
						/>
						<DrawerContent>
							<DrawerHeader>
								<DrawerTitle>Add Lesson</DrawerTitle>
								<DrawerDescription>
									Pick from available lessons
								</DrawerDescription>
							</DrawerHeader>

							<DrawerInner>
								<LessonSelector
									enrolledLessonIds={items}
									value={selectedLessonId}
									onValueChange={setSelectedLessonId}
								/>

								<Marker variant="separator">
									<MarkerContent>or</MarkerContent>
								</Marker>

								<Button>
									<ImportIcon />
									Import from another students
								</Button>
							</DrawerInner>

							<DrawerFooter>
								<DrawerClose
									disabled={!selectedLessonId}
									onClick={handleAddLesson}
									render={<Button />}
								>
									<PlusIcon />
									Add
								</DrawerClose>

								<DrawerClose render={<Button variant="outline" />}>
									Close
								</DrawerClose>
							</DrawerFooter>
						</DrawerContent>
					</Drawer>
				</FrameActions>
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
						className="space-y-3"
					>
						{items.map((lessonId, index) => (
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
														{lesson.description}
													</ItemDescription>
												</ItemContent>
												<ItemContent>
													<Badge variant="secondary">
														{langFlag(lesson.language)}{" "}
														{langName(lesson.language)}
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
				)}
			</FramePanel>
		</Frame>
	);
}

export default StudentLessons;
