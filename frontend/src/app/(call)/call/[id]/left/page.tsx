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
					<CardTitle>You left the meeting</CardTitle>
					<CardDescription>
						You can rejoin as long as the meeting is still live.
					</CardDescription>
				</CardHeader>
				<CardFooter className="justify-end">
					<ButtonGroup>
						{canViewSlot && id && (
							<Button variant={"outline"} asChild>
								<Link href={`/slots/${id}` as "/"}>
									<CalendarClockIcon />
									View Session Details
								</Link>
							</Button>
						)}
						<CallAuthButton />
						{id && (
							<Button asChild>
								<Link href={`/call/${id}` as "/"}>Rejoin meeting</Link>
							</Button>
						)}
					</ButtonGroup>
				</CardFooter>
			</Card>
		</Container>
	);
}
