"use client";

import {
	type DefaultError,
	type QueryKey,
	type UseQueryOptions,
	useQuery,
} from "@tanstack/react-query";
import { period } from "backend/config";
import { parseAsInteger, useQueryState } from "nuqs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
	const { data: list } = useQuery(api);

	return (
		<Field className="w-auto">
			<Select
				defaultValue={defaultUser}
				value={user}
				onValueChange={(selectedId) => {
					if (!selectedId) return;
					setUser(selectedId);
					if (onSelect && list) {
						const selectedItem = list.find((item) => item.id === selectedId);
						if (selectedItem) {
							onSelect(selectedItem);
						}
					}
				}}
			>
				<SelectTrigger title="Hi">
					<SelectValue
						placeholder={`Select a ${label}`}
						children={(item: string) => (
							<FetchUser
								id={item}
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
	const { data: list } = useQuery(api.core.lesson.list.queryOptions());

	return (
		<Field className="w-auto">
			<Select
				defaultValue={defaultLesson}
				value={lesson}
				onValueChange={(c) => {
					setLesson(c);
					if (onSelect && list) {
						const selectedItem = list.find((item) => item.id === lesson);
						if (selectedItem) {
							onSelect(selectedItem);
						}
					}
				}}
			>
				<SelectTrigger>
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
		<Field className="w-auto">
			<Select value={duration} onValueChange={(p) => setDuration(p)}>
				<SelectTrigger>
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
