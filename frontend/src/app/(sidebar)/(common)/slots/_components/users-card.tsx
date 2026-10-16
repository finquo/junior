"use client";

import { useQuery } from "@tanstack/react-query";
import { parseAsInteger, useQueryState } from "nuqs";
import { getDurationFromInterval } from "utils";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { api } from "@/hooks/api";
import { RenderWhenRole } from "@/hooks/role";
import { LessonSelector, PeriodSelector, UserSelector } from "./selecter";

function StudentProgramField() {
	const [studentId] = useQueryState("studentId");
	const { data } = useQuery({
		...api.core.student.get.queryOptions({ input: { id: studentId ?? "" } }),
		enabled: Boolean(studentId),
	});

	return (
		<Field className="w-full min-w-[200px] sm:w-auto">
			<FieldLabel htmlFor="student-program">Program</FieldLabel>
			<Input
				id="student-program"
				value={data?.programInfo?.name ?? ""}
				placeholder="No program assigned"
				disabled
			/>
		</Field>
	);
}

export function UsersCard() {
	const [, setTeacherId] = useQueryState("teacherId");
	const [, setSchedulerId] = useQueryState("schedulerId");
	const [, setDuration] = useQueryState(
		"duration",
		parseAsInteger.withDefault(25),
	);

	return (
		<Card>
			<CardHeader>
				<CardTitle>Select Users & Lessons</CardTitle>
			</CardHeader>
			<CardContent>
				<UserSelector
					name="studentId"
					label="Student"
					api={api.core.student.list.queryOptions()}
					onSelect={(student) => {
						if (student.mentorId) {
							setTeacherId(student.mentorId);
						}
						if (student.supervisorId) {
							setSchedulerId(student.supervisorId);
						}
					}}
				/>
				<StudentProgramField />
				<LessonSelector
					onSelect={(l) => {
						if (l.period) setDuration(getDurationFromInterval(l.period));
					}}
				/>
				<UserSelector
					name="teacherId"
					label="Teacher"
					api={api.core.teacher.list.queryOptions()}
				/>
				<RenderWhenRole role={["admin"]}>
					<UserSelector
						name="schedulerId"
						label="Scheduler"
						api={api.core.scheduler.list.queryOptions()}
					/>
				</RenderWhenRole>
			</CardContent>
			<CardFooter>
				<PeriodSelector />
			</CardFooter>
		</Card>
	);
}
