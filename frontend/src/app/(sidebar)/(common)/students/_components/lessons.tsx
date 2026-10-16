"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { langFlag, langName } from "language-emoji";
import { BookOpenIcon, GraduationCapIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { sileo as toast } from "sileo";
import { formatTimeString } from "utils";
import Loader from "@/components/loader";
import {
	Frame,
	FrameDescription,
	FrameHeader,
	FramePanel,
	FrameTitle,
} from "@/components/reui/frame";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge, ColorBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { api, refetchAPIs } from "@/hooks/api";
import { RenderWhenRole } from "@/hooks/role";

export function StudentLessons({ studentId }: { studentId: string }) {
	const { data, isPending } = useQuery(
		api.core.student.getCurriculum.queryOptions({
			input: { id: studentId },
		}),
	);

	const [attended, setAttended] = useState<string[] | null>(null);
	const attendedIds = attended ?? data?.attendedLessons ?? [];

	const { mutateAsync: updateAttended } = useMutation(
		api.core.student.updateAttendedLessons.mutationOptions({
			onSuccess: () => {
				refetchAPIs([
					api.core.student.getCurriculum.queryKey({
						input: { id: studentId },
					}),
				]);
				toast.success({ title: "Attendance updated" });
			},
		}),
	);

	const handleToggle = async (lessonId: string, checked: boolean) => {
		const next = checked
			? [...attendedIds, lessonId]
			: attendedIds.filter((id) => id !== lessonId);
		setAttended(next);
		await updateAttended({ id: studentId, attendedLessons: next });
	};

	if (isPending) {
		return <Loader />;
	}

	const lessons = data?.lessons ?? [];

	return (
		<Frame>
			<FrameHeader>
				<FrameTitle>Curriculum</FrameTitle>
				<FrameDescription>
					Lessons to attend, in order. Mark each lesson once attended.
				</FrameDescription>
			</FrameHeader>

			<FramePanel>
				{!data?.program ? (
					<Alert>
						<GraduationCapIcon />
						<AlertTitle>No program assigned</AlertTitle>
						<AlertDescription>
							Assign a program to this student to build their curriculum.
						</AlertDescription>
					</Alert>
				) : lessons.length === 0 ? (
					<Alert>
						<BookOpenIcon />
						<AlertTitle>No lessons in this program</AlertTitle>
						<AlertDescription>
							Add lessons to the program to build the curriculum.
						</AlertDescription>
					</Alert>
				) : (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>#</TableHead>
								<TableHead>Lesson</TableHead>
								<TableHead>Language</TableHead>
								<TableHead>Duration</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Attended</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{lessons.map((lesson, index) => {
								const isAttended = attendedIds.includes(lesson.id);
								return (
									<TableRow key={lesson.id}>
										<TableCell>{index + 1}</TableCell>
										<TableCell>
											<Button variant="link" asChild>
												<Link href={`/lessons/${lesson.id}` as "/"}>
													{lesson.name}
												</Link>
											</Button>
										</TableCell>
										<TableCell>
											<Badge variant="secondary">
												{langFlag(lesson.language)} {langName(lesson.language)}
											</Badge>
										</TableCell>
										<TableCell>
											{lesson.period ? (
												<Badge variant="outline">
													{formatTimeString(lesson.period)}
												</Badge>
											) : null}
										</TableCell>
										<TableCell>
											<ColorBadge variant={isAttended ? "success" : "warning"}>
												{isAttended ? "Attended" : "Pending"}
											</ColorBadge>
										</TableCell>
										<TableCell>
											<RenderWhenRole
												role={["admin", "scheduler"]}
												fallback={
													<Checkbox
														checked={isAttended}
														disabled
														aria-label={`${lesson.name} attendance`}
													/>
												}
											>
												<Checkbox
													checked={isAttended}
													onCheckedChange={(checked) =>
														handleToggle(lesson.id, Boolean(checked))
													}
													aria-label={`Mark ${lesson.name} attended`}
												/>
											</RenderWhenRole>
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				)}
			</FramePanel>
		</Frame>
	);
}
