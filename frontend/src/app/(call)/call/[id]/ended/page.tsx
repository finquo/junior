"use client";

import { CalendarClockIcon } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Container } from "@/components/container";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
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
	const canViewSlot = useHasRole(["admin", "scheduler", "teacher"]);

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
					<ButtonGroup>
						{canViewSlot && id && (
							<Button asChild>
								<Link href={`/slots/${id}` as "/"}>
									<CalendarClockIcon />
									View Session Details
								</Link>
							</Button>
						)}
						<CallAuthButton />
					</ButtonGroup>
				</CardFooter>
			</Card>
		</Container>
	);
}
