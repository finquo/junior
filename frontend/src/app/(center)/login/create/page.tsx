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
import { PasswordField } from "../_components/password-field";

export default () => {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");

	const [redirect_to] = useQueryState("redirect_to", { defaultValue: "/me" });
	const callbackURL = getClientBaseUrl(redirect_to);

	return (
		<MutationButton
			api={{
				mutationKey: ["create-with-password"],
				mutationFn: async () => {
					const { data, error } = await authClient.signUp.email({
						name,
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
							<CardTitle>Create Account</CardTitle>
							<CardDescription>
								This page only available on dev mode
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
								<FieldLabel htmlFor="name">Name</FieldLabel>
								<Input
									id="name"
									type="text"
									autoComplete="name"
									placeholder="Name"
									value={name}
									onChange={(e) => setName(e.target.value)}
								/>
							</Field>
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
									autoComplete="new-password"
									value={password}
									onChange={setPassword}
								/>
							</Field>
						</FieldGroup>
					</CardContent>
					<CardFooter>
						<Button type="submit" disabled={!name || !email || !password}>
							Create Account
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
								<FieldLabel htmlFor="name">Name</FieldLabel>
								<Input
									id="name"
									type="text"
									autoComplete="name"
									placeholder="Name"
									value={name}
									onChange={(e) => setName(e.target.value)}
								/>
							</Field>
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
									autoComplete="new-password"
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
							disabled={!name || !email || !password}
						>
							Error! Try Again
						</Button>
					</CardFooter>
				</>
			}
		/>
	);
};
