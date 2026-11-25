"use client";

import { ExternalLinkIcon, PenIcon, PlusIcon, Trash2Icon } from "lucide-react";
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
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useHasRole } from "@/hooks/role";
import type { API_Returns } from "@/lib/api";
import { ModuleDeleteButton } from "../../_components/content-actions";
import { ModuleForm, ModuleQuizList } from "../../_components/module-form";
import { VideoForm } from "../../_components/video-form";
import { VideoOrderList } from "./video-order-list";

type ModuleData = API_Returns["core"]["module"]["get"];
type VideoRecord = API_Returns["core"]["video"]["list"][number];

export function ModuleProfile({
	data,
	videos,
}: {
	data: ModuleData;
	videos: VideoRecord[];
}) {
	const canEditContent = useHasRole(["admin", "scheduler"]);
	const quiz = data.quiz ?? [];

	return (
		<Tabs defaultValue="overview">
			<Card>
				<CardHeader>
					<CardTitle>{data.name}</CardTitle>
					<CardDescription>{data.description}</CardDescription>
					<CardAction>
						<ButtonGroup>
							<Button variant="outline" asChild>
								<Link href="/modules" as="/">
									Back to Modules
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
									<ModuleForm courseId={data.course} module={data}>
										<Button variant="outline">
											<PenIcon />
											Edit
										</Button>
									</ModuleForm>
									<ModuleDeleteButton
										moduleId={data.id}
										courseId={data.course}
										name={data.name}
										navigateOnSuccess
									>
										<Button variant="destructive" size="icon">
											<Trash2Icon />
										</Button>
									</ModuleDeleteButton>
								</>
							)}
						</ButtonGroup>
					</CardAction>
				</CardHeader>
				<CardContent>
					<TabsList>
						<TabsTrigger value="overview">Overview</TabsTrigger>
						<TabsTrigger value="quiz">Quiz</TabsTrigger>
						<TabsTrigger value="videos">Videos</TabsTrigger>
					</TabsList>
				</CardContent>
			</Card>

			<TabsContent value="overview">
				<Card>
					<CardHeader>
						<CardTitle>Module Overview</CardTitle>
						<CardDescription>Module metadata and ownership.</CardDescription>
					</CardHeader>
					<CardContent>
						<Table>
							<TableBody>
								<TableRow>
									<TableCell className="font-medium">Module ID</TableCell>
									<TableCell>{data.id}</TableCell>
									<TableCell>
										<CopyButton
											text={() => data.id}
											label="Module ID"
											variant="outline"
											size="icon-sm"
										/>
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
									<TableCell className="font-medium">Videos</TableCell>
									<TableCell>{data.videoCount}</TableCell>
								</TableRow>
								<TableRow>
									<TableCell className="font-medium">Quiz Questions</TableCell>
									<TableCell>{quiz.length}</TableCell>
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
			</TabsContent>

			<TabsContent value="quiz">
				<Card>
					<CardHeader>
						<CardTitle>Quiz</CardTitle>
						<CardDescription>
							Questions attached to this module. Edit them from the module form.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<ModuleQuizList quiz={quiz} />
					</CardContent>
				</Card>
			</TabsContent>

			<TabsContent value="videos">
				<Card>
					<CardHeader>
						<CardTitle>Videos</CardTitle>
						<CardDescription>Video metadata for this module.</CardDescription>
						<CardAction>
							{canEditContent && (
								<VideoForm courseId={data.course} moduleId={data.id}>
									<Button size="sm">
										<PlusIcon />
										Add Video
									</Button>
								</VideoForm>
							)}
						</CardAction>
					</CardHeader>
					<CardContent>
						{videos.length === 0 ? (
							<Empty>
								<EmptyTitle>No videos yet</EmptyTitle>
								<EmptyDescription>
									Add a video to this module to get started.
								</EmptyDescription>
							</Empty>
						) : (
							<VideoOrderList
								courseId={data.course}
								moduleId={data.id}
								videos={videos}
								sortable={canEditContent}
							/>
						)}
					</CardContent>
				</Card>
			</TabsContent>
		</Tabs>
	);
}
