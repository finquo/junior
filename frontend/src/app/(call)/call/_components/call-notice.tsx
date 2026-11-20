"use client";

import { MessageSquarePlusIcon, RefreshCwIcon } from "lucide-react";
import { useEffect } from "react";
import { FeedbackDialog } from "@/components/custom/feedback-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { CallAuthButton } from "./call-auth-button";

export type CallNoticeStatus = "not_found" | "upcoming" | "ended" | "error";

const notices: Record<
	CallNoticeStatus,
	{ title: string; description: string; alert: string }
> = {
	not_found: {
		title: "Meeting not found",
		description: "This call link does not match any scheduled meeting.",
		alert: "Ask your teacher or scheduler for a valid link.",
	},
	upcoming: {
		title: "Meeting hasn't started",
		description: "You can join 10 minutes before the start time.",
		alert: "Please come back closer to the start time.",
	},
	ended: {
		title: "Meeting has ended",
		description: "This meeting is no longer available to join.",
		alert: "Contact your teacher if you think this is a mistake.",
	},
	error: {
		title: "Something went wrong",
		description: "We could not load this meeting.",
		alert: "Please refresh the page and try again.",
	},
};

// Only states that can change on their own are polled.
const AUTO_REFRESH_STATUSES: CallNoticeStatus[] = ["upcoming", "error"];

export function CallNotice({
	status,
	onRefresh,
	error,
	reference,
}: {
	status: CallNoticeStatus;
	onRefresh?: () => void;
	error?: Error | null;
	reference?: string;
}) {
	const notice = notices[status];

	useEffect(() => {
		if (!onRefresh || !AUTO_REFRESH_STATUSES.includes(status)) return;

		const interval = setInterval(onRefresh, 30_000);
		return () => clearInterval(interval);
	}, [onRefresh, status]);

	const refreshAction = onRefresh ?? (() => window.location.reload());

	return (
		<Card>
			<CardHeader>
				<CardTitle>{notice.title}</CardTitle>
				<CardDescription>{notice.description}</CardDescription>
			</CardHeader>
			<CardContent>
				{error ? (
					<Alert variant="destructive">
						<AlertTitle>{error.name || "Error"}</AlertTitle>
						<AlertDescription>{error.message}</AlertDescription>
					</Alert>
				) : (
					<Alert>
						<AlertTitle>{notice.alert}</AlertTitle>
					</Alert>
				)}
			</CardContent>
			<CardFooter className="justify-end">
				{reference && (
					<FeedbackDialog type="join" reference={reference}>
						<Button variant="secondary">
							<MessageSquarePlusIcon />
							Report an issue
						</Button>
					</FeedbackDialog>
				)}
				<Button variant="secondary" onClick={refreshAction}>
					<RefreshCwIcon />
					Refresh
				</Button>
				<CallAuthButton />
			</CardFooter>
		</Card>
	);
}
