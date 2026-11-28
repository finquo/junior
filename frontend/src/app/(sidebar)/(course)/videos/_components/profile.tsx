"use client";

import { ExternalLinkIcon, PenIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { getRelateTime } from "utils";
import { CopyButton } from "@/components/copy";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { useHasRole } from "@/hooks/role";
import type { API_Returns } from "@/lib/api";
import { VideoDeleteButton } from "../../_components/content-actions";
import { VideoUpdateForm } from "../../_components/video-update";

type VideoData = API_Returns["core"]["video"]["get"];

export function VideoProfile({ data }: { data: VideoData }) {
	const canEditContent = useHasRole(["admin", "scheduler"]);

	return (
		<Card>
			<CardHeader>
				<CardTitle>{data.name}</CardTitle>
				<CardDescription>{data.description}</CardDescription>
				<CardAction>
					<ButtonGroup>
						<Button variant="outline" asChild>
							<Link href={`/modules/${data.module}` as "/"}>
								Back to Module
							</Link>
						</Button>
						<Button variant="outline" asChild>
							<Link href={`/courses/${data.course}` as "/"}>
								<ExternalLinkIcon />
								Course
							</Link>
						</Button>
						{canEditContent && (
							<>
								<VideoUpdateForm courseId={data.course} video={data}>
									<Button variant="outline">
										<PenIcon />
										Edit
									</Button>
								</VideoUpdateForm>
								<VideoDeleteButton
									videoId={data.id}
									courseId={data.course}
									moduleId={data.module}
									name={data.name}
								>
									<Button variant="destructive" size="icon">
										<Trash2Icon />
									</Button>
								</VideoDeleteButton>
							</>
						)}
					</ButtonGroup>
				</CardAction>
			</CardHeader>
			<CardContent>
				<Table>
					<TableBody>
						<TableRow>
							<TableCell className="font-medium">Video ID</TableCell>
							<TableCell>{data.id}</TableCell>
							<TableCell>
								<CopyButton
									text={() => data.id}
									label="Video ID"
									variant="outline"
									size="icon"
								/>
							</TableCell>
						</TableRow>
						<TableRow>
							<TableCell className="font-medium">Module</TableCell>
							<TableCell>
								<Button variant="link" asChild className="h-auto p-0">
									<Link href={`/modules/${data.module}` as "/"}>
										{data.moduleName}
									</Link>
								</Button>
							</TableCell>
						</TableRow>
						<TableRow>
							<TableCell className="font-medium">Course</TableCell>
							<TableCell>
								<Button variant="link" asChild className="h-auto p-0">
									<Link href={`/courses/${data.course}` as "/"}>
										{data.courseName}
									</Link>
								</Button>
							</TableCell>
						</TableRow>
						<TableRow>
							<TableCell className="font-medium">Created</TableCell>
							<TableCell>{getRelateTime(data.createdAt)} ago</TableCell>
						</TableRow>
						<TableRow>
							<TableCell className="font-medium">Last Updated</TableCell>
							<TableCell>{getRelateTime(data.updatedAt)} ago</TableCell>
						</TableRow>
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	);
}
