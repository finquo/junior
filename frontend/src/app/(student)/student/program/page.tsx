"use client";

import { useQuery } from "@tanstack/react-query";
import { GraduationCapIcon, PackageIcon } from "lucide-react";
import Loader from "@/components/loader";
import {
	Frame,
	FrameDescription,
	FrameHeader,
	FramePanel,
	FrameTitle,
} from "@/components/reui/frame";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemGroup,
	ItemMedia,
	ItemTitle,
} from "@/components/ui/item";
import { api } from "@/hooks/api";

export default function Page() {
	const {
		data: program,
		isPending: isProgramPending,
		isError: isProgramError,
	} = useQuery(api.student.getProgram.queryOptions());
	const { data: lessons = [], isPending: isLessonsPending } = useQuery(
		api.student.getLessons.queryOptions(),
	);

	if (isProgramPending || isLessonsPending) return <Loader />;

	if (isProgramError) {
		return (
			<Alert variant="destructive">
				<AlertTitle>Program Unavailable</AlertTitle>
				<AlertDescription>Your program could not be loaded.</AlertDescription>
			</Alert>
		);
	}

	const attendedCount = lessons.filter((lesson) => lesson.attended).length;

	return (
		<Frame>
			<FrameHeader>
				<FrameTitle>Program</FrameTitle>
				<FrameDescription>The program you are enrolled in</FrameDescription>
			</FrameHeader>
			<FramePanel>
				{program ? (
					<Card>
						<CardHeader>
							<CardTitle>{program.name}</CardTitle>
							{program.description && (
								<CardDescription>{program.description}</CardDescription>
							)}
							<CardAction>
								<Badge variant="secondary">
									{attendedCount} of {lessons.length} lessons attended
								</Badge>
							</CardAction>
						</CardHeader>
						<CardContent>
							<ItemGroup>
								{program.materials.map((material) => (
							<Item key={material.id} variant="muted">
								<ItemMedia variant="icon">
									<PackageIcon />
								</ItemMedia>
								<ItemContent>
									<ItemTitle>{material.name}</ItemTitle>
								</ItemContent>
								<ItemActions>
									<Badge variant="outline">
										{material.lessons.length}{" "}
										{material.lessons.length === 1 ? "lesson" : "lessons"}
									</Badge>
								</ItemActions>
							</Item>
								))}
							</ItemGroup>
						</CardContent>
					</Card>
				) : (
					<Empty>
						<EmptyHeader>
							<EmptyMedia variant="icon">
								<GraduationCapIcon />
							</EmptyMedia>
							<EmptyTitle>No program assigned</EmptyTitle>
							<EmptyDescription>
								You will see your program here once one has been assigned to
								you.
							</EmptyDescription>
						</EmptyHeader>
					</Empty>
				)}
			</FramePanel>
		</Frame>
	);
}
