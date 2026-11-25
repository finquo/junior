"use client";

import { useQuery } from "@tanstack/react-query";
import { LayersIcon, ListIcon } from "lucide-react";
import { Field, FieldLabel } from "@/components/ui/field";
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

export function CourseSelector({
	id,
	label = "Course",
	value,
	onValueChange,
	disabled,
}: {
	id?: string;
	label?: string;
	value?: string | null;
	onValueChange?: (val: string) => void;
	disabled?: boolean;
}) {
	const { data = [], isPending } = useQuery(
		api.core.course.list.queryOptions(),
	);

	return (
		<Field>
			<FieldLabel htmlFor={id}>{label}</FieldLabel>
			<Select
				value={value ?? ""}
				disabled={disabled}
				onValueChange={(val) => {
					if (val) onValueChange?.(val);
				}}
			>
				<SelectTrigger id={id} className="w-full min-w-[200px]">
					{isPending ? (
						<Skeleton className="h-4 w-full max-w-40" />
					) : (
						<SelectValue
							placeholder={`Select a ${label.toLowerCase()}`}
							children={(courseId: string) => (
								<span>
									{data.find((course) => course.id === courseId)?.name ??
										`Unknown course (${courseId})`}
								</span>
							)}
						/>
					)}
				</SelectTrigger>
				<SelectContent alignItemWithTrigger={false}>
					<SelectGroup>
						<SelectLabel>Available Courses</SelectLabel>
						{data.length === 0 ? (
							<SelectItem value="none" disabled>
								No courses available
							</SelectItem>
						) : (
							data.map((course) => (
								<SelectItem key={course.id} value={course.id}>
									<span className="flex items-center gap-2">
										<LayersIcon className="size-4 text-muted-foreground" />
										<span>{course.name}</span>
									</span>
								</SelectItem>
							))
						)}
					</SelectGroup>
				</SelectContent>
			</Select>
		</Field>
	);
}

export function ModuleSelector({
	courseId,
	id,
	label = "Module",
	value,
	onValueChange,
	disabled,
}: {
	courseId: string;
	id?: string;
	label?: string;
	value?: string | null;
	onValueChange?: (val: string) => void;
	disabled?: boolean;
}) {
	const { data = [], isPending } = useQuery(
		api.core.module.list.queryOptions({
			input: { course: courseId },
		}),
	);

	return (
		<Field>
			<FieldLabel htmlFor={id}>{label}</FieldLabel>
			<Select
				value={value ?? ""}
				disabled={disabled}
				onValueChange={(val) => {
					if (val) onValueChange?.(val);
				}}
			>
				<SelectTrigger id={id} className="w-full min-w-[200px]">
					{isPending ? (
						<Skeleton className="h-4 w-full max-w-40" />
					) : (
						<SelectValue
							placeholder={`Select a ${label.toLowerCase()}`}
							children={(moduleId: string) => (
								<span>
									{data.find((module) => module.id === moduleId)?.name ??
										`Unknown module (${moduleId})`}
								</span>
							)}
						/>
					)}
				</SelectTrigger>
				<SelectContent alignItemWithTrigger={false}>
					<SelectGroup>
						<SelectLabel>Available Modules</SelectLabel>
						{data.length === 0 ? (
							<SelectItem value="none" disabled>
								No modules available
							</SelectItem>
						) : (
							data.map((module) => (
								<SelectItem key={module.id} value={module.id}>
									<span className="flex items-center gap-2">
										<ListIcon className="size-4 text-muted-foreground" />
										<span>{module.name}</span>
									</span>
								</SelectItem>
							))
						)}
					</SelectGroup>
				</SelectContent>
			</Select>
		</Field>
	);
}
