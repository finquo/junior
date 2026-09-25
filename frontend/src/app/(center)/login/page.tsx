import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { PasswordLogin } from "./_components/password";

export default function Page() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Login</CardTitle>
				<CardDescription>
					Login with credentials you got from us
				</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-col">
				<PasswordLogin>
					<Button variant="outline">Create Account</Button>
				</PasswordLogin>
			</CardContent>
		</Card>
	);
}
