"use client";

import { useQuery } from "@tanstack/react-query";
import { GraduationCapIcon } from "lucide-react";
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
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import {
	Item,
	ItemContent,
	ItemDescription,
	ItemMedia,
	ItemTitle,
} from "@/components/ui/item";
import { api } from "@/hooks/api";

export default function Page() {
	const {
		data: program,
		isPending,
		isError,
	} = useQuery(api.student.getProgram.queryOptions());

	if (isPending) return <Loader />;

	if (isError) {
		return (
			<Alert variant="destructive">
				<AlertTitle>Program Unavailable</AlertTitle>
				<AlertDescription>Your program could not be loaded.</AlertDescription>
			</Alert>
		);
	}

	return (
		<Frame spacing="sm">
			<FramePanel>
				<FrameHeader>
					<FrameTitle>Program</FrameTitle>
					<FrameDescription>The program you are enrolled in</FrameDescription>
				</FrameHeader>
				{program ? (
					<Item variant="outline">
						<ItemMedia variant="icon">
							<GraduationCapIcon />
						</ItemMedia>
						<ItemContent>
							<ItemTitle>{program.name}</ItemTitle>
							{program.description && (
								<ItemDescription>{program.description}</ItemDescription>
							)}
						</ItemContent>
					</Item>
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
