"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { MutationButton } from "@/hooks/button";
import { getClientBaseUrl } from "@/hooks/url";
import { authClient } from "@/lib/auth";

export const PasswordLogin = () => {
	const redirect_to = useSearchParams().get("redirect_to");
	const callbackURL = getClientBaseUrl(redirect_to ?? "/me");

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	return (
		<MutationButton
			api={{
				mutationKey: ["login-with-password"],
				mutationFn: async () => {
					const { data, error } = await authClient.signIn.email({
						email,
						password,
						callbackURL,
					});

					if (error) throw error;
					return data;
				},
			}}
			mutate={(mutate) => (
				<>
					<FieldGroup>
						<Field>
							<FieldLabel htmlFor="email">Email</FieldLabel>
							<Input
								id="email"
								type="email"
								placeholder="name@example.com"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
							/>
						</Field>
						<Field>
							<FieldLabel htmlFor="password">Password</FieldLabel>
							<Input
								id="password"
								type="password"
								placeholder="super-secret"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
							/>
						</Field>
					</FieldGroup>
					<Button onClick={() => mutate()} disabled={!email || !password}>
						Sign In
					</Button>
				</>
			)}
			isPending={<Button disabled>Signing In...</Button>}
			isError={<Button variant="destructive">Error! Try Again</Button>}
			isSuccess={<Button variant="outline">Redirecting...</Button>}
		/>
	);
};
