"use client";

import { RefreshCwIcon } from "lucide-react";
import { useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
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
}: {
	status: CallNoticeStatus;
	onRefresh?: () => void;
	error?: Error | null;
}) {
	const notice = notices[status];

	useEffect(() => {
		if (!onRefresh || !AUTO_REFRESH_STATUSES.includes(status)) return;

		const interval = setInterval(onRefresh, 30_000);
		return () => clearInterval(interval);
	}, [onRefresh, status]);

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
				<ButtonGroup>
					<Button
						variant="outline"
						onClick={onRefresh ?? (() => window.location.reload())}
					>
						<RefreshCwIcon />
						Refresh
					</Button>
					<CallAuthButton />
				</ButtonGroup>
			</CardFooter>
		</Card>
	);
}
