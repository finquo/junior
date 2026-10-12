"use client";

import { parseAsInteger, useQueryState } from "nuqs";
import { getDurationFromInterval } from "utils";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { api } from "@/hooks/api";
import { RenderWhenRole } from "@/hooks/role";
import { LessonSelector, PeriodSelector, UserSelector } from "./selecter";

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
				<LessonSelector
					onSelect={(l) => {
						if (l.period) setDuration(getDurationFromInterval(l.period));
					}}
				/>
			</CardContent>
			<CardFooter>
				<PeriodSelector />
			</CardFooter>
		</Card>
	);
}
