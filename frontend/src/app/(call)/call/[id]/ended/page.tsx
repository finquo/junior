import { Container } from "@/components/container";
import {
	Card,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { CallAuthButton } from "../../_components/call-auth-button";

export default function Page() {
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
					<CallAuthButton />
				</CardFooter>
			</Card>
		</Container>
	);
}
