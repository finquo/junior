"use client";

import { period } from "backend/config";
import { parseAsInteger, useQueryState } from "nuqs";
import { Button } from "@/components/ui/button";
import { ButtonGroup, ButtonGroupText } from "@/components/ui/button-group";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { api } from "@/hooks/api";
import { RenderWhenRole } from "@/hooks/role";
import { LessonSelector, UserSelector } from "./selecter";

export function UsersCard() {
	const [, setTeacherId] = useQueryState("teacherId");
	const [, setSchedulerId] = useQueryState("schedulerId");
	const [duration, setDuration] = useQueryState(
		"duration",
		parseAsInteger.withDefault(25),
	);

	const isDurationSelected = (val: number) => duration === val;

	return (
		<Card>
			<CardHeader>
				<CardTitle>Select Users</CardTitle>
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
				<LessonSelector name="lessonId" label="Lesson" />
			</CardContent>
			<CardFooter>
				<ButtonGroup>
					<ButtonGroupText>Durations</ButtonGroupText>
					{period.map((value) => {
						const isSelected = isDurationSelected(value);
						const variant = isSelected ? "default" : "outline";
						return (
							<Button
								key={value}
								variant={variant}
								onClick={() => setDuration(value)}
							>
								{value} mins
							</Button>
						);
					})}
				</ButtonGroup>
			</CardFooter>
		</Card>
	);
}
