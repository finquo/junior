import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { CreateAccount } from "../_components/create";

export default function Page() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Create Account</CardTitle>
				<CardDescription>This page only available on dev mode</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-col">
				<CreateAccount />
			</CardContent>
		</Card>
	);
}
