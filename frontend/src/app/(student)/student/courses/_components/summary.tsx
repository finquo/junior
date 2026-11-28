"use client";

import { ClapperboardIcon, VideoIcon } from "lucide-react";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
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
	ItemTitle,
} from "@/components/ui/item";
import { Progress } from "@/components/ui/progress";
import type { API_Returns } from "@/lib/api";

type Modules = API_Returns["student"]["getCourseVideoGroups"];

export function SummaryView({ modules }: { modules: Modules }) {
	if (modules.length === 0)
		return (
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<ClapperboardIcon />
					</EmptyMedia>
					<EmptyTitle>No modules yet</EmptyTitle>
					<EmptyDescription>
						Modules will appear here once your course is set up.
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		);

	const activeStep = modules.find((module) => module.status === "upcoming")?.id;

	return (
		<Accordion type="single" collapsible defaultValue={activeStep}>
			{modules.map((module) => {
				const isAttended = module.status === "attended";
				const content =
					module.videos.length === 0 ? (
						<Empty>
							<EmptyHeader>
								<EmptyMedia variant="icon">
									<VideoIcon />
								</EmptyMedia>
								<EmptyTitle>No videos yet</EmptyTitle>
								<EmptyDescription>
									Videos will appear here once added to this module.
								</EmptyDescription>
							</EmptyHeader>
						</Empty>
					) : (
						<Item key={module.id} variant={"outline"}>
							<ItemContent>
								<ItemTitle>{module.name}</ItemTitle>
								<ItemDescription>{module.description}</ItemDescription>
							</ItemContent>
							<ItemActions>
								<Badge>Videos {module.videos.length}</Badge>
							</ItemActions>
							<Progress
								aria-label="Module progress"
								value={
									(module.videos.filter((v) => v.status === "watched").length /
										module.videos.length) *
									10
								}
							/>
						</Item>
					);

				return (
					<AccordionItem key={module.id} value={module.id}>
						<AccordionTrigger
							secondary={
								isAttended ? (
									<Badge variant="success">Attended</Badge>
								) : undefined
							}
						>
							Module {module.position}
						</AccordionTrigger>
						<AccordionContent>{content}</AccordionContent>
					</AccordionItem>
				);
			})}
		</Accordion>
	);
}
