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
					<CardTitle>Meeting has ended</CardTitle>
					<CardDescription>
						This meeting has been ended for everyone. You can close this window.
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
				</CardFooter>
			</Card>
		</Container>
	);
}
