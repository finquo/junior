"use client";

import { useQuery } from "@tanstack/react-query";
import { period } from "backend/config";
import { parseAsInteger, useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/hooks/api";
import type { API_Returns } from "@/lib/api";

export function LessonSelector({
	defaultLesson,
	onSelect,
}: {
	defaultLesson?: string;
	onSelect?: (
		item: API_Returns["core"]["student"]["lessons"]["lessons"][number],
	) => void;
}) {
	const [lesson, setLesson] = useQueryState("lessonId");
	const [studentId] = useQueryState("studentId");
	const [onlyUnattended, setOnlyUnattended] = useState(true);

	const { data, isPending } = useQuery({
		...api.core.student.lessons.queryOptions({
			input: { id: studentId ?? "" },
		}),
		enabled: Boolean(studentId),
	});

	useEffect(() => {
		if (!onSelect || !data) return;

		const list = onlyUnattended ? data.unattendedLessons : data.lessons;
		const selectedItem = list.find((item) => item.id === lesson);
		if (selectedItem) {
			onSelect(selectedItem);
		}
	}, [lesson, data, onlyUnattended, onSelect]);

	const list = (onlyUnattended ? data?.unattendedLessons : data?.lessons) ?? [];

	if (!studentId) {
		return (
			<Field className="w-full min-w-[200px] sm:w-auto">
				<FieldLabel htmlFor="lessonId">Lesson</FieldLabel>
				<Select disabled>
					<SelectTrigger id="lessonId" className="w-full min-w-[200px]">
						<SelectValue placeholder="Select a Student first" />
					</SelectTrigger>
				</Select>
			</Field>
		);
	}

	if (isPending) {
		return (
			<Field className="w-full min-w-[200px] sm:w-auto">
				<FieldLabel htmlFor="lessonId">Lesson</FieldLabel>
				<div className="flex h-9 w-full min-w-[200px] items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs">
					<Skeleton className="h-4 w-28" />
				</div>
			</Field>
		);
	}

	return (
		<FieldGroup>
			<Field className="w-full min-w-[200px] sm:w-auto">
				<FieldLabel htmlFor="lessonId">Lesson</FieldLabel>
				<Select
					defaultValue={defaultLesson}
					value={lesson}
					onValueChange={(c) => {
						if (!c) return;
						setLesson(c);
					}}
				>
					<SelectTrigger id="lessonId" className="w-full min-w-[200px]">
						<SelectValue
							placeholder={"Select a Lesson"}
							children={(item: string) => {
								const selected = list.find((l) => l.id === item);
								return <span>{selected?.name ?? "Select Lesson"}</span>;
							}}
						/>
					</SelectTrigger>
					<SelectContent alignItemWithTrigger={false}>
						<SelectGroup>
							<SelectLabel>Select a Lesson</SelectLabel>
							{list.map((l) => (
								<SelectItem key={l.id} value={l.id}>
									{l.name}
								</SelectItem>
							))}
						</SelectGroup>
					</SelectContent>
				</Select>
			</Field>
			<Field orientation="horizontal" className="w-fit">
				<Checkbox
					id="only-unattended"
					checked={onlyUnattended}
					onCheckedChange={(checked) => setOnlyUnattended(Boolean(checked))}
				/>
				<FieldLabel htmlFor="only-unattended">
					Show only unattended lessons
				</FieldLabel>
			</Field>
		</FieldGroup>
	);
}

export function PeriodSelector({
	value,
	onChange,
}: {
	value?: number;
	onChange?: (duration: number) => void;
}) {
	const [urlDuration, setUrlDuration] = useQueryState(
		"duration",
		parseAsInteger,
	);
	const duration = value ?? urlDuration;

	const setDuration = (d: number) => {
		if (onChange) return onChange(d);
		setUrlDuration(d);
	};

	const options =
		duration && !period.includes(duration)
			? [...period, duration].sort((a, b) => a - b)
			: period;

	return (
		<Field className="w-full min-w-[200px] sm:w-auto">
			<FieldLabel htmlFor="duration">Duration</FieldLabel>
			<Select value={duration} onValueChange={(p) => setDuration(p)}>
				<SelectTrigger id="duration" className="w-full min-w-[200px]">
					<SelectValue
						placeholder={"Pick Duration"}
						children={(item?: number) => {
							if (typeof item === "number")
								return <span>Duration: {item} mins</span>;
							return <span>Pick Duration</span>;
						}}
					/>
				</SelectTrigger>
				<SelectContent alignItemWithTrigger={false}>
					<SelectGroup>
						<SelectLabel>Select a Period</SelectLabel>
						{options.map((p) => (
							<SelectItem key={p} value={p}>
								{p} mins
							</SelectItem>
						))}
					</SelectGroup>
				</SelectContent>
			</Select>
		</Field>
	);
}
