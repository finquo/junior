"use client";

import { useQueryState } from "nuqs";
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
import { RenderWhenRole } from "@/hooks/role";
import { FetchUser } from "@/hooks/user";
import {
	LessonSelector,
	PeriodSelector,
	UserSelector,
} from "../../../_components/selecter";

function ReadonlyUserField({ name, label }: { name: string; label: string }) {
	const [user] = useQueryState(name);

	return (
		<Field className="w-full min-w-[200px] sm:w-auto">
			<FieldLabel htmlFor={name}>{label}</FieldLabel>
			<Select disabled value={user}>
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

export function EditUsersCard() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Edit Users & Lessons</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<ReadonlyUserField name="studentId" label="Student" />
				<LessonSelector />
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
				<RenderWhenRole role={["scheduler"]}>
					<ReadonlyUserField name="schedulerId" label="Scheduler" />
				</RenderWhenRole>
			</CardContent>
			<CardFooter>
				<PeriodSelector />
			</CardFooter>
		</Card>
	);
}
