"use client";

import { useQueryState } from "nuqs";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { MutationButton } from "@/hooks/button";
import { getClientBaseUrl } from "@/hooks/url";
import { authClient } from "@/lib/auth";
import { PasswordField } from "./password-field";

export const PasswordLogin = () => {
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
			mutate={(mutate) => (
				<form
					onSubmit={(e) => {
						e.preventDefault();
						mutate();
					}}
				>
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
				</form>
			)}
			isPending={<Button disabled>Signing In...</Button>}
			isSuccess={<Button variant="outline">Redirecting...</Button>}
			reTry={(mutate) => (
				<form
					onSubmit={(e) => {
						e.preventDefault();
						mutate();
					}}
				>
					<CardContent />
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
					<Button
						type="submit"
						variant="destructive"
						disabled={!email || !password}
					>
						Error! Try Again
					</Button>
				</form>
			)}
		/>
	);
};
