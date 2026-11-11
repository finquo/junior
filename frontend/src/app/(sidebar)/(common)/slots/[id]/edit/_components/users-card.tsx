"use client";

import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Select, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/hooks/api";
import { FetchLesson } from "@/hooks/lesson";
import { RenderWhenRole } from "@/hooks/role";
import { FetchUser } from "@/hooks/user";
import type { API_Returns } from "@/lib/api";
import {
	PeriodSelector,
	UserSelector,
} from "../../../_components/selecter";

type SlotData = NonNullable<API_Returns["core"]["slot"]["get"]>;

function ReadonlyUserField({
	name,
	label,
	value,
}: {
	name: string;
	label: string;
	value?: string;
}) {
	return (
		<Field className="w-full min-w-[200px] sm:w-auto">
			<FieldLabel htmlFor={name}>{label}</FieldLabel>
			<Select disabled value={value}>
				<SelectTrigger id={name} className="w-full min-w-[200px]">
					<SelectValue
						placeholder={`No ${label} selected`}
						children={(item: string) => (
							<FetchUser
								id={item}
								isPending={<Skeleton className="h-4 w-24" />}
							>
								{(user) => user.name}
							</FetchUser>
						)}
					/>
				</SelectTrigger>
			</Select>
		</Field>
	);
}

function ReadonlyLessonField({ lessonId }: { lessonId: string }) {
	return (
		<Field className="w-full min-w-[200px] sm:w-auto">
			<FieldLabel htmlFor="lessonId">Lesson</FieldLabel>
			<Select disabled value={lessonId}>
				<SelectTrigger id="lessonId" className="w-full min-w-[200px]">
					<SelectValue
						placeholder="No Lesson selected"
						children={(item: string) => (
							<FetchLesson
								id={item}
								isPending={<Skeleton className="h-4 w-24" />}
							>
								{(lesson) => lesson.name}
							</FetchLesson>
						)}
					/>
				</SelectTrigger>
			</Select>
		</Field>
	);
}

export function EditUsersCard({
	slot,
	teacherId,
	onTeacherChange,
	schedulerId,
	onSchedulerChange,
	duration,
	onDurationChange,
}: {
	slot: SlotData;
	teacherId: string | null;
	onTeacherChange: (id: string) => void;
	schedulerId: string | null;
	onSchedulerChange: (id: string) => void;
	duration: number;
	onDurationChange: (duration: number) => void;
}) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Edit Users & Lessons</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<ReadonlyUserField
					name="studentId"
					label="Student"
					value={slot.studentId ?? undefined}
				/>
				<ReadonlyLessonField lessonId={slot.lessonId} />
				<UserSelector
					name="teacherId"
					label="Teacher"
					value={teacherId ?? undefined}
					onChange={onTeacherChange}
					api={api.core.teacher.list.queryOptions()}
				/>
				<RenderWhenRole role={["admin"]}>
					<UserSelector
						name="schedulerId"
						label="Scheduler"
						value={schedulerId ?? undefined}
						onChange={onSchedulerChange}
						api={api.core.scheduler.list.queryOptions()}
					/>
				</RenderWhenRole>
				<RenderWhenRole role={["scheduler"]}>
					<ReadonlyUserField
						name="schedulerId"
						label="Scheduler"
						value={slot.schedulerId ?? undefined}
					/>
				</RenderWhenRole>
			</CardContent>
			<CardFooter>
				<PeriodSelector value={duration} onChange={onDurationChange} />
			</CardFooter>
		</Card>
	);
}
