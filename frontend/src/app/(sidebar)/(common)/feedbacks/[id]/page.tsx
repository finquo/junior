"use client";

import { useMutation } from "@tanstack/react-query";
import type { FeedbackStatusZod } from "backend/db";
import {
	ArrowLeftIcon,
	CheckIcon,
	MessageSquareTextIcon,
	TagIcon,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { sileo as toast } from "sileo";
import { getRelateTime } from "utils";
import { CopyButton } from "@/components/copy";
import Loader from "@/components/loader";
import { ProfileCard } from "@/components/profile";
import {
	Frame,
	FrameActions,
	FrameDescription,
	FrameHeader,
	FramePanel,
	FrameTitle,
} from "@/components/reui/frame";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemGroup,
	ItemMedia,
	ItemTitle,
} from "@/components/ui/item";
import { Spinner } from "@/components/ui/spinner";
import { api, refetchAPIs } from "@/hooks/api";
import { LoadQuery } from "@/hooks/load";
import { FetchUser } from "@/hooks/user";
import type { API_Returns } from "@/lib/api";

type Feedback = NonNullable<API_Returns["feedback"]["get"]>;

const statusBadge: Record<
	(typeof FeedbackStatusZod.options)[number],
	"success" | "warning" | "outline"
> = {
	pending: "warning",
	resolved: "success",
	unresolvable: "outline",
};

function StatusActions({ feedback }: { feedback: Feedback }) {
	const { mutate, isPending } = useMutation(
		api.feedback.resolve.mutationOptions({
			onSuccess: () => {
				refetchAPIs([
					api.feedback.list.queryKey(),
					api.feedback.get.queryKey({ input: { id: feedback.id } }),
				]);
				toast.success({ title: "Status updated" });
			},
			onError: (error) =>
				toast.error({
					title: error.message || "Failed to update status",
				}),
		}),
	);

	return (
		<ButtonGroup>
			{isPending && (
				<Button variant="outline" size="icon" disabled>
					<Spinner />
				</Button>
			)}
			{feedback.status !== "resolved" && (
				<Button
					variant="secondary"
					disabled={isPending}
					onClick={() => mutate({ id: feedback.id, status: "resolved" })}
				>
					<CheckIcon />
					Resolve
				</Button>
			)}
			{feedback.status !== "unresolvable" && (
				<Button
					variant="outline"
					disabled={isPending}
					onClick={() => mutate({ id: feedback.id, status: "unresolvable" })}
				>
					Unresolvable
				</Button>
			)}
			{feedback.status !== "pending" && (
				<Button
					variant="ghost"
					disabled={isPending}
					onClick={() => mutate({ id: feedback.id, status: "pending" })}
				>
					Reopen
				</Button>
			)}
		</ButtonGroup>
	);
}

function ResolvedBy({ feedback }: { feedback: Feedback }) {
	if (!feedback.resolvedBy) return null;

	return (
		<Item variant="outline">
			<FetchUser
				id={feedback.resolvedBy}
				isPending={<Spinner />}
				notFound={
					<ItemContent>
						<ItemTitle>Unknown user</ItemTitle>
					</ItemContent>
				}
			>
				{(user) => (
					<>
						<ItemMedia>
							<Avatar>
								<AvatarImage src={user.image ?? undefined} />
								<AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
							</Avatar>
						</ItemMedia>
						<ItemContent>
							<ItemTitle>Resolved by</ItemTitle>
							<ItemDescription>{user.name}</ItemDescription>
						</ItemContent>
					</>
				)}
			</FetchUser>
		</Item>
	);
}

function FeedbackProfile({ feedback }: { feedback: Feedback }) {
	if (!feedback.userId) {
		return (
			<Alert>
				<AlertTitle>Anonymous feedback</AlertTitle>
				<AlertDescription>
					This feedback was submitted without a signed-in account.
				</AlertDescription>
			</Alert>
		);
	}

	return (
		<FetchUser id={feedback.userId} isPending={<Loader />}>
			{(user) => <ProfileCard user={user} />}
		</FetchUser>
	);
}

function FeedbackDetails({ feedback }: { feedback: Feedback }) {
	return (
		<ItemGroup>
			<Item variant="outline">
				<ItemMedia variant="icon">
					<TagIcon />
				</ItemMedia>
				<ItemContent>
					<ItemTitle>Type</ItemTitle>
					<ItemDescription>Where this feedback came from</ItemDescription>
				</ItemContent>
				<ItemActions>
					<Badge variant="outline">{feedback.type}</Badge>
				</ItemActions>
			</Item>
			<Item variant="outline">
				<ItemMedia variant="icon">
					<CheckIcon />
				</ItemMedia>
				<ItemContent>
					<ItemTitle>Status</ItemTitle>
				</ItemContent>
				<ItemActions>
					<Badge variant={statusBadge[feedback.status]}>
						{feedback.status}
					</Badge>
				</ItemActions>
			</Item>
			{feedback.ref && (
				<Item variant="outline">
					<ItemContent>
						<ItemTitle>Reference</ItemTitle>
						<ItemDescription>{feedback.ref}</ItemDescription>
					</ItemContent>
					<ItemActions>
						<CopyButton
							text={() => feedback.ref ?? ""}
							label="Reference"
							variant="ghost"
							size="icon-sm"
						/>
					</ItemActions>
				</Item>
			)}
			<Item variant="outline">
				<ItemContent>
					<ItemTitle>Submitted</ItemTitle>
				</ItemContent>
				<ItemActions>
					<Badge variant="outline">
						{getRelateTime(new Date(feedback.createdAt))} ago
					</Badge>
				</ItemActions>
			</Item>
			<ResolvedBy feedback={feedback} />
		</ItemGroup>
	);
}

function FeedbackView({ feedback }: { feedback: Feedback }) {
	return (
		<Frame>
			<FrameHeader>
				<FrameTitle>Feedback</FrameTitle>
				<FrameDescription>{feedback.content}</FrameDescription>
				<FrameActions>
					<ButtonGroup>
						<Button asChild variant="outline">
							<Link href="/feedbacks">
								<ArrowLeftIcon />
								List
							</Link>
						</Button>
						<StatusActions feedback={feedback} />
					</ButtonGroup>
				</FrameActions>
			</FrameHeader>
			<FramePanel>
				<Item variant="outline">
					<ItemMedia variant="icon">
						<MessageSquareTextIcon />
					</ItemMedia>
					<ItemContent>
						<ItemDescription>{feedback.content}</ItemDescription>
					</ItemContent>
				</Item>
				<FeedbackDetails feedback={feedback} />
				<FeedbackProfile feedback={feedback} />
			</FramePanel>
		</Frame>
	);
}

export default function Page() {
	const id = useParams<{ id: string }>().id;

	return (
		<LoadQuery
			label="Feedback"
			api={api.feedback.get.queryOptions({ input: { id } })}
		>
			{(feedback) => <FeedbackView feedback={feedback} />}
		</LoadQuery>
	);
}
