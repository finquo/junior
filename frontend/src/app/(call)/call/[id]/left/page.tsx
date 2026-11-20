"use client";

import { CalendarClockIcon, MessageSquarePlusIcon } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Container } from "@/components/container";
import { FeedbackDialog } from "@/components/custom/feedback-dialog";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useHasRole } from "@/hooks/role";
import { CallAuthButton } from "../../_components/call-auth-button";

export default function Page() {
	const id = useParams<{ id: string }>()?.id;
	const canViewSlot = useHasRole([
		"admin",
		"scheduler",
		"teacher",
		"qa_auditor",
	]);

	return (
		<Container>
			<Card>
				<CardHeader>
					<CardTitle>You left the meeting</CardTitle>
					<CardDescription>
						You can rejoin as long as the meeting is still live.
					</CardDescription>
				</CardHeader>
				<CardFooter className="justify-end">
					{id && (
						<FeedbackDialog type="join" reference={`slot:${id}`}>
							<Button variant="outline">
								<MessageSquarePlusIcon />
								Report an issue
							</Button>
						</FeedbackDialog>
					)}
					{canViewSlot && id && (
						<Button variant="outline" asChild>
							<Link href={`/slots/${id}`}>
								<CalendarClockIcon />
								View Session Details
							</Link>
						</Button>
					)}
					<CallAuthButton />
					{id && (
						<Button asChild>
							<Link href={`/call/${id}`}>Rejoin meeting</Link>
						</Button>
					)}
				</CardFooter>
			</Card>
		</Container>
	);
}
