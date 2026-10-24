"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { period } from "backend/config";
import { PenIcon } from "lucide-react";
import { useParams } from "next/navigation";
import { type ReactElement, useState } from "react";
import { sileo as toast } from "sileo";
import { z } from "zod";
import Loader from "@/components/loader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerInner,
	DrawerTitle,
	DrawerTrigger,
} from "@/components/ui/drawer";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { UserFormSelector } from "@/components/user-selector";
import { api, refetchAPIs } from "@/hooks/api";
import { RenderWhenRole } from "@/hooks/role";
import type { API_Returns } from "@/lib/api";
import { type GetFormZod, snakeToTitleCase } from "@/lib/utils";
import { SessionProfile } from "../_components/session";

type SlotData = NonNullable<API_Returns["core"]["slot"]["get"]>;

const slotStatuses = [
	"scheduled",
	"request_reschedule",
	"rescheduled",
	"started",
	"attended",
] as const satisfies readonly SlotData["status"][];

const slotEditSchema = z.object({
	studentId: z.string().min(1, "Student is required"),
	teacherId: z.string().min(1, "Teacher is required"),
	lessonId: z.string().min(1, "Lesson is required"),
	status: z.enum(slotStatuses),
	startTime: z.string().min(1, "Start time is required"),
	duration: z
		.number()
		.min(15, "Minimum 15 minutes")
		.max(250, "Maximum 250 minutes"),
	meetingLink: z.string(),
});

type SlotEditValues = z.infer<typeof slotEditSchema>;

function toLocalInputValue(date: Date) {
	const pad = (value: number) => String(value).padStart(2, "0");
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toFormValues(slot: SlotData): SlotEditValues {
	const start = new Date(slot.startTime);
	const end = new Date(slot.expectedEndTime);
	const duration = Math.round((end.getTime() - start.getTime()) / 60_000);

	return {
		studentId: slot.studentId ?? "",
		teacherId: slot.teacherId ?? "",
		lessonId: slot.lessonId ?? "",
		status: slot.status,
		startTime: toLocalInputValue(start),
		duration: Math.min(250, Math.max(15, duration)),
		meetingLink: slot.meetingLink ?? "",
	};
}

function LessonField({
	id,
	studentId,
	value,
	onValueChange,
	disabled,
}: {
	id: string;
	studentId: string;
	value: string;
	onValueChange: (value: string) => void;
	disabled?: boolean;
}) {
	const { data, isPending } = useQuery({
		...api.core.student.lessons.queryOptions({ input: { id: studentId } }),
		enabled: Boolean(studentId),
	});

	const lessons = data?.lessons ?? [];

	return (
		<Field>
			<FieldLabel htmlFor={id}>Lesson</FieldLabel>
			<Select
				value={value}
				onValueChange={onValueChange}
				disabled={disabled || !studentId || isPending}
			>
				<SelectTrigger id={id} className="w-full min-w-[200px]">
					<SelectValue
						placeholder={
							studentId ? "Select a Lesson" : "Select a Student first"
						}
						children={(item: string) => (
							<span>
								{lessons.find((lesson) => lesson.id === item)?.name ??
									"Select Lesson"}
							</span>
						)}
					/>
				</SelectTrigger>
				<SelectContent alignItemWithTrigger={false}>
					<SelectGroup>
						<SelectLabel>Select a Lesson</SelectLabel>
						{lessons.map((lesson) => (
							<SelectItem key={lesson.id} value={lesson.id}>
								{lesson.name}
							</SelectItem>
						))}
					</SelectGroup>
				</SelectContent>
			</Select>
		</Field>
	);
}

function EditSlotDrawer({
	slot,
	children,
}: {
	slot: SlotData;
	children: ReactElement;
}) {
	const [open, setOpen] = useState(false);

	const { mutateAsync, isPending } = useMutation(
		api.core.slot.update.mutationOptions({
			onSuccess: () => {
				refetchAPIs([
					api.core.slot.get.queryKey({ input: { id: slot.id } }),
					api.core.slot.list.queryKey(),
				]);
				toast.success({ title: "Session updated successfully" });
				setOpen(false);
			},
		}),
	);

	const form = useForm({
		defaultValues: toFormValues(slot),
		validators: {
			onSubmit: slotEditSchema as GetFormZod<typeof slotEditSchema>,
		},
		onSubmit: async ({ value }) => {
			const startTime = new Date(value.startTime);

			await mutateAsync({
				id: slot.id,
				studentId: value.studentId,
				teacherId: value.teacherId,
				lessonId: value.lessonId,
				status: value.status,
				startTime,
				expectedEndTime: new Date(
					startTime.getTime() + value.duration * 60_000,
				),
				meetingLink: value.meetingLink.trim() || null,
			});
		},
	});

	return (
		<Drawer
			open={open}
			onOpenChange={(next) => {
				setOpen(next);
				if (next) form.reset(toFormValues(slot));
			}}
		>
			<DrawerTrigger asChild>{children}</DrawerTrigger>
			<DrawerContent>
				<DrawerHeader>
					<DrawerTitle>Edit Session</DrawerTitle>
					<DrawerDescription>
						Update participants, schedule, and status for this session.
					</DrawerDescription>
				</DrawerHeader>

				<DrawerInner asChild>
					<form
						onSubmit={(e) => {
							e.preventDefault();
							e.stopPropagation();
							form.handleSubmit();
						}}
					>
						<FieldGroup>
							<form.Field
								name="studentId"
								children={(field) => (
									<UserFormSelector
										id={field.name}
										label="Student"
										value={field.state.value}
										onValueChange={(value) => field.handleChange(value ?? "")}
										api={api.core.student.list.queryOptions()}
										disabled={isPending}
									/>
								)}
							/>

							<form.Subscribe selector={(state) => state.values.studentId}>
								{(studentId) => (
									<form.Field
										name="lessonId"
										children={(field) => (
											<LessonField
												id={field.name}
												studentId={studentId}
												value={field.state.value}
												onValueChange={field.handleChange}
												disabled={isPending}
											/>
										)}
									/>
								)}
							</form.Subscribe>

							<form.Field
								name="teacherId"
								children={(field) => (
									<UserFormSelector
										id={field.name}
										label="Teacher"
										value={field.state.value}
										onValueChange={(value) => field.handleChange(value ?? "")}
										api={api.core.teacher.list.queryOptions()}
										disabled={isPending}
									/>
								)}
							/>

							<form.Field
								name="startTime"
								children={(field) => (
									<Field>
										<FieldLabel htmlFor={field.name}>Start Time</FieldLabel>
										<Input
											id={field.name}
											name={field.name}
											type="datetime-local"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											disabled={isPending}
										/>
									</Field>
								)}
							/>

							<form.Field
								name="duration"
								children={(field) => {
									const options = Array.from(
										new Set([...period, field.state.value]),
									).sort((a, b) => a - b);

									return (
										<Field>
											<FieldLabel htmlFor={field.name}>
												Duration (Minutes)
											</FieldLabel>
											<Select
												value={field.state.value}
												onValueChange={(value) =>
													field.handleChange(Number(value))
												}
												disabled={isPending}
											>
												<SelectTrigger
													id={field.name}
													className="w-full min-w-[200px]"
												>
													<SelectValue>
														{(item?: number) => <span>{item} mins</span>}
													</SelectValue>
												</SelectTrigger>
												<SelectContent alignItemWithTrigger={false}>
													<SelectGroup>
														<SelectLabel>Select a Period</SelectLabel>
														{options.map((option) => (
															<SelectItem key={option} value={option}>
																{option} mins
															</SelectItem>
														))}
													</SelectGroup>
												</SelectContent>
											</Select>
										</Field>
									);
								}}
							/>

							<form.Field
								name="status"
								children={(field) => (
									<Field>
										<FieldLabel htmlFor={field.name}>Status</FieldLabel>
										<Select
											value={field.state.value}
											onValueChange={(value) =>
												field.handleChange(value as SlotEditValues["status"])
											}
											disabled={isPending}
										>
											<SelectTrigger
												id={field.name}
												className="w-full min-w-[200px]"
											>
												<SelectValue>
													{(item: SlotEditValues["status"]) => (
														<span>{snakeToTitleCase(item)}</span>
													)}
												</SelectValue>
											</SelectTrigger>
											<SelectContent alignItemWithTrigger={false}>
												<SelectGroup>
													<SelectLabel>Select a Status</SelectLabel>
													{slotStatuses.map((status) => (
														<SelectItem key={status} value={status}>
															{snakeToTitleCase(status)}
														</SelectItem>
													))}
												</SelectGroup>
											</SelectContent>
										</Select>
									</Field>
								)}
							/>

							<form.Field
								name="meetingLink"
								children={(field) => (
									<Field>
										<FieldLabel htmlFor={field.name}>Meeting Link</FieldLabel>
										<Input
											id={field.name}
											name={field.name}
											type="url"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder="https://..."
											disabled={isPending}
										/>
									</Field>
								)}
							/>
						</FieldGroup>

						<form.Subscribe
							selector={(state) => [state.canSubmit, state.isDirty]}
							children={([canSubmit, isDirty]) => (
								<DrawerFooter>
									<Button
										type="submit"
										disabled={!isDirty || isPending || !canSubmit}
									>
										{isPending && <Spinner />}
										Save Changes
									</Button>
									<DrawerClose asChild>
										<Button
											variant="outline"
											type="button"
											disabled={isPending}
										>
											Close
										</Button>
									</DrawerClose>
								</DrawerFooter>
							)}
						/>
					</form>
				</DrawerInner>
			</DrawerContent>
		</Drawer>
	);
}

function Session({ slotId }: { slotId: string }) {
	const { data, isPending, isError } = useQuery(
		api.core.slot.get.queryOptions({
			input: { id: slotId },
		}),
	);

	if (isPending) {
		return <Loader />;
	}

	if (isError || !data) {
		return (
			<Alert variant="destructive">
				<AlertTitle>Session Not Found</AlertTitle>
				<AlertDescription>
					The requested session could not be loaded or does not exist.
				</AlertDescription>
			</Alert>
		);
	}

	return (
		<SessionProfile
			data={data}
			edit={
				<RenderWhenRole role={["admin", "scheduler"]}>
					<EditSlotDrawer slot={data}>
						<Button variant="outline" size="sm">
							<PenIcon />
							Edit
						</Button>
					</EditSlotDrawer>
				</RenderWhenRole>
			}
		/>
	);
}

export default function Page() {
	const params = useParams<{ id: string }>();
	const slotId = params?.id;

	if (!slotId) {
		return (
			<Alert variant="destructive">
				<AlertTitle>Invalid Session ID</AlertTitle>
				<AlertDescription>
					No session identifier was found in the URL.
				</AlertDescription>
			</Alert>
		);
	}

	return <Session slotId={slotId} />;
}
