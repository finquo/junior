"use client";

import { langFlag, langName } from "language-emoji";
import { PenIcon, PlusIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { sileo as toast } from "sileo";
import {
	type CountryCodes,
	getCountryCurrencySymbol,
	getCountryName,
} from "utils";
import { CopyButton } from "@/components/copy";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
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
import {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemGroup,
	ItemTitle,
} from "@/components/ui/item";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api, refetchAPIs } from "@/hooks/api";
import { MutationButton } from "@/hooks/button";
import { useHasRole } from "@/hooks/role";
import type { API_Returns } from "@/lib/api";
import { VideoDeleteButton } from "../../_components/content-actions";
import { ModuleForm } from "../../_components/module-form";
import { VideoUpdateForm } from "../../_components/video-update";
import { ModuleOrderList } from "./module-order-list";

type CourseRecord = API_Returns["core"]["course"]["get"];
type ModuleRecord = API_Returns["core"]["module"]["list"][number];
type VideoRecord = API_Returns["core"]["video"]["list"][number];

function formatPrice(code: CountryCodes, amount: number) {
	return `${getCountryCurrencySymbol(code)}${amount.toLocaleString()}`;
}

function CourseDeleteButton({
	course,
	children,
}: {
	course: CourseRecord;
	children: React.ReactElement;
}) {
	const router = useRouter();

	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete {course.name}?</AlertDialogTitle>
					<AlertDialogDescription>
						This removes the course, its modules, and their videos. This cannot
						be undone.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<MutationButton
						api={api.core.course.delete.mutationOptions({
							onSuccess: () => {
								refetchAPIs([
									api.core.course.list.queryKey(),
									api.sidebar.courses.queryKey(),
								]);
								toast.success({ title: "Course deleted" });
								router.push("/courses" as "/");
							},
						})}
						mutate={(mutate) => (
							<AlertDialogAction
								variant="destructive"
								onClick={() => mutate({ id: course.id })}
							>
								<Trash2Icon />
								Delete
							</AlertDialogAction>
						)}
						isPending={
							<AlertDialogAction variant="destructive">
								Deleting
							</AlertDialogAction>
						}
					/>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

export function CourseProfile({
	data,
	modules,
	videos,
}: {
	data: CourseRecord;
	modules: ModuleRecord[];
	videos: VideoRecord[];
}) {
	const canEditCourse = useHasRole("admin");
	const canEditContent = useHasRole(["admin", "scheduler"]);
	const moduleNames = new Map(
		modules.map((module) => [module.id, module.name]),
	);

	return (
		<Tabs defaultValue="overview">
			<Card>
				<CardHeader>
					<CardTitle>{data.name}</CardTitle>
					<CardDescription>{data.description}</CardDescription>
					<CardAction>
						<ButtonGroup>
							{canEditCourse && (
								<>
									<Button variant="outline" asChild>
										<Link href={`/courses/${data.id}/edit` as "/"}>
											<PenIcon />
											Edit Course
										</Link>
									</Button>
									<CourseDeleteButton course={data}>
										<Button variant="destructive" size="icon">
											<Trash2Icon />
										</Button>
									</CourseDeleteButton>
								</>
							)}
						</ButtonGroup>
					</CardAction>
				</CardHeader>
				<CardContent>
					<TabsList>
						<TabsTrigger value="overview">Overview</TabsTrigger>
						<TabsTrigger value="modules">Modules</TabsTrigger>
						<TabsTrigger value="videos">Videos</TabsTrigger>
					</TabsList>
				</CardContent>
			</Card>

			<TabsContent value="overview">
				<Card>
					<CardHeader>
						<CardTitle>Course Overview</CardTitle>
						<CardDescription>
							Course metadata and regional pricing.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Table>
							<TableBody>
								<TableRow>
									<TableCell className="font-medium">Course ID</TableCell>
									<TableCell>
										<span>{data.id}</span>
									</TableCell>
									<TableCell>
										<CopyButton
											size={"icon-xs"}
											variant="outline"
											text={() => data.id}
											label="Course ID"
										/>
									</TableCell>
								</TableRow>
								<TableRow>
									<TableCell className="font-medium">Language</TableCell>
									<TableCell>
										{langFlag(data.language)} {langName(data.language)}
									</TableCell>
								</TableRow>
								<TableRow>
									<TableCell className="font-medium">Modules</TableCell>
									<TableCell>{data.moduleCount}</TableCell>
								</TableRow>
								<TableRow>
									<TableCell className="font-medium">Videos</TableCell>
									<TableCell>{data.videoCount}</TableCell>
								</TableRow>
								{Object.entries(data.price ?? {}).map(([code, amount]) => (
									<TableRow key={code}>
										<TableCell className="font-medium">
											{getCountryName(code)}
										</TableCell>
										<TableCell>
											{formatPrice(code as CountryCodes, amount)}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			</TabsContent>

			<TabsContent value="modules">
				<Card>
					<CardHeader>
						<CardTitle>Modules</CardTitle>
						<CardDescription>
							Manage modules and their quiz questions.
						</CardDescription>
						<CardAction>
							{canEditContent && (
								<ModuleForm courseId={data.id}>
									<Button size="sm">
										<PlusIcon />
										Add Module
									</Button>
								</ModuleForm>
							)}
						</CardAction>
					</CardHeader>
					<CardContent>
						{modules.length === 0 ? (
							<Empty>
								<EmptyTitle>No modules yet</EmptyTitle>
								<EmptyDescription>
									Create a module to start building this course.
								</EmptyDescription>
							</Empty>
						) : (
							<ModuleOrderList courseId={data.id} modules={modules} />
						)}
					</CardContent>
				</Card>
			</TabsContent>

			<TabsContent value="videos">
				<Card>
					<CardHeader>
						<CardTitle>Videos</CardTitle>
						<CardDescription>Manage course video metadata.</CardDescription>
						<CardAction>
							{canEditContent && (
								<Button size="sm" asChild>
									<Link href={`/videos/new?course=${data.id}` as "/"}>
										<PlusIcon />
										Add Video
									</Link>
								</Button>
							)}
						</CardAction>
					</CardHeader>
					<CardContent>
						{videos.length === 0 ? (
							<Empty>
								<EmptyTitle>No videos yet</EmptyTitle>
								<EmptyDescription>
									Add a video to a module in this course.
								</EmptyDescription>
							</Empty>
						) : (
							<ItemGroup>
								{videos.map((video) => (
									<Item key={video.id} variant="muted">
										<ItemContent>
											<ItemTitle>{video.name}</ItemTitle>
											<ItemDescription>{video.description}</ItemDescription>
										</ItemContent>
										<ItemContent className="grow">
											<Badge variant="outline">
												{video.module
													? (moduleNames.get(video.module) ?? video.module)
													: "No module"}
											</Badge>
										</ItemContent>
										<ItemActions>
											<ButtonGroup>
												<Button size={"sm"} asChild>
													<Link href={`/videos/${video.id}` as "/"}>View</Link>
												</Button>

												{canEditContent && (
													<>
														<VideoUpdateForm courseId={data.id} video={video}>
															<Button variant="outline" size="icon-sm">
																<PenIcon />
															</Button>
														</VideoUpdateForm>
														<VideoDeleteButton
															videoId={video.id}
															courseId={data.id}
															moduleId={video.module}
															name={video.name}
															navigateOnSuccess={false}
														>
															<Button variant="destructive" size="icon-sm">
																<Trash2Icon />
															</Button>
														</VideoDeleteButton>
													</>
												)}
											</ButtonGroup>
										</ItemActions>
									</Item>
								))}
							</ItemGroup>
						)}
					</CardContent>
				</Card>
			</TabsContent>
		</Tabs>
	);
}
