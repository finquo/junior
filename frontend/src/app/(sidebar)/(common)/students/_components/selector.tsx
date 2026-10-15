"use client";

import { useQuery } from "@tanstack/react-query";
import { langFlag, langName } from "language-emoji";
import { BookOpenIcon } from "lucide-react";
import * as React from "react";
import { formatTimeString } from "utils";
import { Badge } from "@/components/ui/badge";
import {
	Combobox,
	ComboboxChip,
	ComboboxChips,
	ComboboxChipsInput,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxItem,
	ComboboxList,
	ComboboxValue,
	useComboboxAnchor,
} from "@/components/ui/combobox";
import { Field } from "@/components/ui/field";
import {
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemTitle,
} from "@/components/ui/item";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { api } from "@/hooks/api";
import { FetchLesson } from "@/hooks/lesson";
import type { API_Returns } from "@/lib/api";

export type LessonItemData = API_Returns["core"]["lesson"]["list"][number];

export function LessonComboboxItem({
	lesson,
}: {
	lesson: {
		name: string;
		description?: string | null;
		language?: string | null;
		period?: string | null;
	};
}) {
	return (
		<div className="flex w-full flex-col gap-2 py-1.5">
			<ItemContent className="min-w-0">
				<ItemTitle>
					<BookOpenIcon className="size-4 shrink-0 text-muted-foreground" />
					<span className="truncate">{lesson.name}</span>
				</ItemTitle>
				{lesson.description && (
					<ItemDescription className="line-clamp-2">
						{lesson.description}
					</ItemDescription>
				)}
			</ItemContent>
			<ItemActions>
				{lesson.language && (
					<Badge variant="secondary" className="text-xs">
						{langFlag(lesson.language)} {langName(lesson.language)}
					</Badge>
				)}
				{lesson.period && (
					<Badge variant="outline" className="text-xs">
						{formatTimeString(lesson.period)}
					</Badge>
				)}
			</ItemActions>
		</div>
	);
}

export function MultiLessonSelector({
	label = "Lesson",
	enrolledLessonIds = [],
	value = [],
	onValueChange,
	container,
}: {
	label?: string;
	enrolledLessonIds?: string[];
	value?: string[];
	onValueChange?: (val: string[]) => void;
	container?: HTMLElement | null;
}) {
	const anchor = useComboboxAnchor();
	const { data = [] } = useQuery(api.core.lesson.list.queryOptions());

	const availableLessons = React.useMemo(
		() => data.filter((l) => !enrolledLessonIds.includes(l.id)),
		[data, enrolledLessonIds],
	);

	return (
		<Field>
			<Combobox<string, true, LessonItemData>
				multiple
				autoHighlight
				items={availableLessons}
				itemToStringLabel={(val) => data.find((l) => l.id === val)?.name ?? val}
				filter={(lesson, query) => {
					const q = query.toLowerCase();
					return (
						lesson.name.toLowerCase().includes(q) ||
						(lesson.description?.toLowerCase().includes(q) ?? false) ||
						(lesson.language?.toLowerCase().includes(q) ?? false)
					);
				}}
				value={value}
				onValueChange={(val) => {
					if (onValueChange) onValueChange(val);
				}}
			>
				<ComboboxChips ref={anchor} className="w-full">
					<ComboboxValue>
						{(values: string[]) => (
							<React.Fragment>
								{values.map((lessonId: string) => {
									const lesson = data.find((l) => l.id === lessonId);
									return (
										<ComboboxChip key={lessonId}>
											<BookOpenIcon className="size-3 text-muted-foreground" />
											<span>{lesson?.name ?? lessonId}</span>
											{lesson?.language && (
												<span>{langFlag(lesson.language)}</span>
											)}
										</ComboboxChip>
									);
								})}
								<ComboboxChipsInput
									placeholder={
										value.length === 0
											? `Select ${label.toLowerCase()}s...`
											: ""
									}
								/>
							</React.Fragment>
						)}
					</ComboboxValue>
				</ComboboxChips>
				<ComboboxContent
					anchor={anchor}
					container={container}
					className="max-h-72"
				>
					<ComboboxEmpty>
						{availableLessons.length === 0
							? "All lessons already enrolled"
							: "No lessons found"}
					</ComboboxEmpty>
					<ComboboxList>
						{(lesson: LessonItemData) => (
							<ComboboxItem key={lesson.id} value={lesson.id}>
								<LessonComboboxItem lesson={lesson} />
							</ComboboxItem>
						)}
					</ComboboxList>
				</ComboboxContent>
			</Combobox>
		</Field>
	);
}

export function LessonSelector({
	label = "Lesson",
	enrolledLessonIds = [],
	value,
	onValueChange,
}: {
	label?: string;
	enrolledLessonIds?: string[];
	value?: string | null;
	onValueChange?: (val: string) => void;
}) {
	const { data = [] } = useQuery(api.core.lesson.list.queryOptions());

	const availableLessons = data.filter(
		(l) => !enrolledLessonIds.includes(l.id),
	);

	return (
		<Field>
			<Select
				value={value}
				onValueChange={(val) => {
					if (onValueChange && val) onValueChange(val);
				}}
			>
				<SelectTrigger>
					<SelectValue
						placeholder={`Select a ${label.toLowerCase()}`}
						children={(itemId: string) => (
							<FetchLesson
								id={itemId}
								children={(lesson) => <span>{lesson.name}</span>}
							/>
						)}
					/>
				</SelectTrigger>
				<SelectContent alignItemWithTrigger={false}>
					<SelectGroup>
						<SelectLabel>Available Lessons</SelectLabel>
						{availableLessons.length === 0 ? (
							<SelectItem value="none" disabled>
								All lessons already enrolled
							</SelectItem>
						) : (
							availableLessons.map((l) => (
								<SelectItem key={l.id} value={l.id}>
									<FetchLesson
										id={l.id}
										children={(lesson) => (
											<span className="flex items-center gap-2">
												<BookOpenIcon className="size-4 text-muted-foreground" />
												<span>{lesson.name}</span>
												{lesson.language && (
													<Badge variant="secondary" className="text-xs">
														{lesson.language}
													</Badge>
												)}
											</span>
										)}
									/>
								</SelectItem>
							))
						)}
					</SelectGroup>
				</SelectContent>
			</Select>
		</Field>
	);
}

export default LessonSelector;
