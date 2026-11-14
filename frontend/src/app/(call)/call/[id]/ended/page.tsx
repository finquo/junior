"use client";

import { CalendarClockIcon } from "lucide-react";
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
					<CardTitle>Meeting has ended</CardTitle>
					<CardDescription>
						This meeting has been ended for everyone. You can close this window.
					</CardDescription>
				</CardHeader>
				<CardFooter style={{ justifyContent: "flex-end" }}>
					{canViewSlot && id && (
						<ArcButton onClick={() => router.push(`/slots/${id}`)}>
							<CalendarClockIcon />
							View Session Details
						</ArcButton>
					)}
					<CallAuthButton />
				</CardFooter>
			</Card>
		</Container>
	);
}
