"use client";

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
import { CallAuthButton } from "../../_components/call-auth-button";

export default function Page() {
	const params = useParams<{ id: string }>();
	const id = params?.id;

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
						{id && (
							<Button asChild>
								<Link href={`/call/${id}` as "/"}>Rejoin meeting</Link>
							</Button>
						)}
						<CallAuthButton />
					</ButtonGroup>
				</CardFooter>
			</Card>
		</Container>
	);
}
