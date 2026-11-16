"use client";

import { useQueryState } from "nuqs";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { MutationButton } from "@/hooks/button";
import { getClientBaseUrl } from "@/hooks/url";
import { authClient } from "@/lib/auth";
import { PasswordField } from "./_components/password-field";

export default () => {
	const [email, setEmail] = useQueryState("email", { defaultValue: "" });
	const [password, setPassword] = useState("");
	const [redirect_to] = useQueryState("redirect_to", { defaultValue: "/me" });
	const callbackURL = getClientBaseUrl(redirect_to);

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
			wrapper={(children, mutate) => (
				<form
					onSubmit={(e) => {
						e.preventDefault();
						mutate();
					}}
				>
					<Card>
						<CardHeader>
							<CardTitle>Login</CardTitle>
							<CardDescription>
								Login with credentials you got from us
							</CardDescription>
						</CardHeader>
						{children}
					</Card>
				</form>
			)}
			children={
				<>
					<CardContent>
						<FieldGroup>
							<Field>
								<FieldLabel htmlFor="email">Email</FieldLabel>
								<Input
									id="email"
									type="email"
									autoComplete="email"
									placeholder="name@example.com"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
								/>
							</Field>
							<Field>
								<FieldLabel htmlFor="password">Password</FieldLabel>
								<PasswordField
									id="password"
									autoComplete="current-password"
									value={password}
									onChange={setPassword}
								/>
							</Field>
						</FieldGroup>
					</CardContent>
					<CardFooter>
						<Button type="submit" disabled={!email || !password}>
							Sign In
						</Button>
					</CardFooter>
				</>
			}
			isPending={
				<CardFooter>
					<Button disabled>Signing In...</Button>
				</CardFooter>
			}
			isSuccess={
				<CardFooter>
					<Button variant="outline">Redirecting...</Button>
				</CardFooter>
			}
			isError={
				<>
					<CardContent>
						<FieldGroup>
							<Field>
								<FieldLabel htmlFor="email">Email</FieldLabel>
								<Input
									id="email"
									type="email"
									autoComplete="email"
									placeholder="name@example.com"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
								/>
							</Field>
							<Field>
								<FieldLabel htmlFor="password">Password</FieldLabel>
								<PasswordField
									id="password"
									autoComplete="current-password"
									value={password}
									onChange={setPassword}
									defaultVisible
								/>
							</Field>
						</FieldGroup>
					</CardContent>
					<CardFooter>
						<Button
							type="submit"
							variant="destructive"
							disabled={!email || !password}
						>
							Error! Try Again
						</Button>
					</CardFooter>
				</>
			}
		/>
	);
};
