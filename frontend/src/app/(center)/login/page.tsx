import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { PasswordLogin } from "./_components/password";

export default function () {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Login</CardTitle>
				<CardDescription>
					Login with credentials you got from us
				</CardDescription>
			</CardHeader>
			<PasswordLogin />
		</Card>
	);
}
