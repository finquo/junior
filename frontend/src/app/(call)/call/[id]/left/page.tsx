"use client";

import { CalendarClockIcon, MessageSquarePlusIcon } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { Button as ArcButton } from "@/components/arc/button/button";
import {
	Card,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/arc/card/card";
import { Container } from "@/components/container";
import { FeedbackDialog } from "@/components/custom/feedback-dialog";
import { useHasRole } from "@/hooks/role";
import { CallAuthButton } from "../../_components/call-auth-button";

export default function Page() {
	const router = useRouter();
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
				<CardFooter style={{ justifyContent: "flex-end" }}>
					{id && (
						<FeedbackDialog type="join" reference={`slot:${id}`}>
							<ArcButton variant="secondary">
								<MessageSquarePlusIcon />
								Report an issue
							</ArcButton>
						</FeedbackDialog>
					)}
					{canViewSlot && id && (
						<ArcButton
							variant="secondary"
							onClick={() => router.push(`/slots/${id}`)}
						>
							<CalendarClockIcon />
							View Session Details
						</ArcButton>
					)}
					<CallAuthButton />
					{id && (
						<ArcButton onClick={() => router.push(`/call/${id}`)}>
							Rejoin meeting
						</ArcButton>
					)}
				</CardFooter>
			</Card>
		</Container>
	);
}
