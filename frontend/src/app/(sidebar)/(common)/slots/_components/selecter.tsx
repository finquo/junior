"use client";

import {
	type DefaultError,
	type QueryKey,
	type UseQueryOptions,
	useQuery,
} from "@tanstack/react-query";
import { period } from "backend/config";
import { parseAsInteger, useQueryState } from "nuqs";
import { useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Field } from "@/components/ui/field";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/hooks/api";
import { FetchUser } from "@/hooks/user";
import type { API_Returns } from "@/lib/api";
import { getInitials } from "@/lib/utils";

export function UserSelector<
	TData extends { id: string }[] = { id: string }[],
	TError = DefaultError,
	TQueryKey extends QueryKey = QueryKey,
>({
	name = "user",
	label = "User",
	defaultUser,
	onSelect,
	api,
}: {
	name?: string;
	label?: string;
	defaultUser?: string;
	onSelect?: (item: TData[number]) => void;
	api: UseQueryOptions<TData, TError, TData, TQueryKey>;
}) {
	const [user, setUser] = useQueryState(name);
	const { data: list, isPending } = useQuery(api);

	useEffect(() => {
		if (onSelect) {
			if (!list) return;

			const selectedItem = list.find((item) => item.id === user);
			if (selectedItem) {
				onSelect(selectedItem);
			}
		}
	}, [user, list, onSelect]);

	if (isPending) {
		return (
			<Field className="w-full sm:w-auto min-w-[200px]">
				<div className="flex h-9 w-full min-w-[200px] items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs">
					<Skeleton className="size-5 rounded-full" />
					<Skeleton className="h-4 w-28" />
				</div>
			</Field>
		);
	}

	return (
		<Field className="w-full sm:w-auto min-w-[200px]">
			<Select
				defaultValue={defaultUser}
				value={user}
				onValueChange={(selectedId) => {
					if (!selectedId) return;
					setUser(selectedId);
				}}
			>
				<SelectTrigger className="w-full min-w-[200px]" title="Hi">
					<SelectValue
						placeholder={`Select a ${label}`}
						children={(item: string) => (
							<FetchUser
								id={item}
								isPending={
									<span className="flex items-center gap-2">
										<Skeleton className="size-5 rounded-full" />
										<Skeleton className="h-4 w-24" />
									</span>
								}
								children={(user) => (
									<span className="flex items-center gap-2">
										<Avatar className="size-5">
											<AvatarImage src={user.image} alt={user.name} />
											<AvatarFallback>{getInitials(user.name)}</AvatarFallback>
										</Avatar>
										<span>{user.name}</span>
									</span>
								)}
							/>
						)}
					/>
				</SelectTrigger>
				<SelectContent alignItemWithTrigger={false}>
					<SelectGroup>
						<SelectLabel>Select a {label}</SelectLabel>
						{(list as { id: string }[] | undefined)?.map((l) => (
							<SelectItem key={l.id} value={l.id}>
								<FetchUser
									id={l.id}
									isPending={
										<span className="flex items-center gap-2">
											<Skeleton className="size-5 rounded-full" />
											<Skeleton className="h-4 w-24" />
										</span>
									}
									children={(user) => (
										<span className="flex items-center gap-2">
											<Avatar className="size-5">
												<AvatarImage src={user.image} alt={user.name} />
												<AvatarFallback>
													{getInitials(user.name)}
												</AvatarFallback>
											</Avatar>
											<span>{user.name}</span>
										</span>
									)}
								/>
							</SelectItem>
						))}
					</SelectGroup>
				</SelectContent>
			</Select>
		</Field>
	);
}

export function LessonSelector({
	defaultLesson,
	onSelect,
}: {
	defaultLesson?: string;
	onSelect?: (item: API_Returns["core"]["lesson"]["list"][number]) => void;
}) {
	const [lesson, setLesson] = useQueryState("lessonId");
	const { data: list, isPending } = useQuery(api.core.lesson.list.queryOptions());

	useEffect(() => {
		if (onSelect) {
			if (!list) return;

			const selectedItem = list.find((item) => item.id === lesson);
			if (selectedItem) {
				onSelect(selectedItem);
			}
		}
	}, [lesson, list, onSelect]);

	if (isPending) {
		return (
			<Field className="w-full sm:w-auto min-w-[200px]">
				<div className="flex h-9 w-full min-w-[200px] items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs">
					<Skeleton className="h-4 w-28" />
				</div>
			</Field>
		);
	}

	return (
		<Field className="w-full sm:w-auto min-w-[200px]">
			<Select
				defaultValue={defaultLesson}
				value={lesson}
				onValueChange={(c) => {
					if (!c) return;
					setLesson(c);
				}}
			>
				<SelectTrigger className="w-full min-w-[200px]">
					<SelectValue
						placeholder={"Select a Lesson"}
						children={(item: string) => {
							const selected = list?.find((l) => l.id === item);
							return <span>{selected?.name ?? "Select Lesson"}</span>;
						}}
					/>
				</SelectTrigger>
				<SelectContent alignItemWithTrigger={false}>
					<SelectGroup>
						<SelectLabel>Select a Lesson</SelectLabel>
						{list?.map((l) => (
							<SelectItem key={l.id} value={l.id}>
								{l.name}
							</SelectItem>
						))}
					</SelectGroup>
				</SelectContent>
			</Select>
		</Field>
	);
}

export function PeriodSelector() {
	const [duration, setDuration] = useQueryState("duration", parseAsInteger);

	return (
		<Field className="w-full sm:w-auto min-w-[200px]">
			<Select value={duration} onValueChange={(p) => setDuration(p)}>
				<SelectTrigger className="w-full min-w-[200px]">
					<SelectValue
						placeholder={"Pick Duration"}
						children={(item?: number) => {
							if (typeof item === "number")
								return <span>Duration: {item} mins</span>;
							return <span>Pick Duration</span>;
						}}
					/>
				</SelectTrigger>
				<SelectContent alignItemWithTrigger={false}>
					<SelectGroup>
						<SelectLabel>Select a Period</SelectLabel>
						{period.map((p) => (
							<SelectItem key={p} value={p}>
								{p} mins
							</SelectItem>
						))}
					</SelectGroup>
				</SelectContent>
			</Select>
		</Field>
	);
}
