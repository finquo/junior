"use client";

import { useQuery } from "@tanstack/react-query";
import { GraduationCapIcon, PackageIcon } from "lucide-react";
import { Alert } from "@/components/arc/alert/alert";
import { Badge } from "@/components/arc/badge/badge";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/arc/card/card";
import { EmptyState } from "@/components/arc/empty-state/empty-state";
import {
	Item,
	ItemActions,
	ItemContent,
	ItemGroup,
	ItemMedia,
	ItemTitle,
} from "@/components/arc/item/item";
import Loader from "@/components/loader";
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
			<Alert tone="danger" title="Program Unavailable">
				Your program could not be loaded.
			</Alert>
		);
	}

	const attendedCount = lessons.filter((lesson) => lesson.attended).length;

	if (!program)
		return (
			<EmptyState
				icon={<GraduationCapIcon />}
				title="No program assigned"
				description="You will see your program here once one has been assigned to you."
			/>
		);

	return (
		<Card>
			<CardHeader>
				<CardTitle>{program.name}</CardTitle>
				{program.description && (
					<CardDescription>{program.description}</CardDescription>
				)}
				<CardAction>
					<Badge tone="neutral">
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
								<Badge tone="neutral">
									{material.lessons.length}{" "}
									{material.lessons.length === 1 ? "lesson" : "lessons"}
								</Badge>
							</ItemActions>
						</Item>
					))}
				</ItemGroup>
			</CardContent>
		</Card>
	);
}
