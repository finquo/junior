import { Alert, AlertTitle } from "@/components/ui/alert";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

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

export function CallNotice({ status }: { status: CallNoticeStatus }) {
	const notice = notices[status];

	return (
		<Card>
			<CardHeader>
				<CardTitle>{notice.title}</CardTitle>
				<CardDescription>{notice.description}</CardDescription>
			</CardHeader>
			<CardContent>
				<Alert>
					<AlertTitle>{notice.alert}</AlertTitle>
				</Alert>
			</CardContent>
		</Card>
	);
}
