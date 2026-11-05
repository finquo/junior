"use client";

import { useQueryState } from "nuqs";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { MutationButton } from "@/hooks/button";
import { getClientBaseUrl } from "@/hooks/url";
import { authClient } from "@/lib/auth";
import { PasswordField } from "./password-field";

export const CreateAccount = () => {
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
			mutate={(mutate) => (
				<form
					onSubmit={(e) => {
						e.preventDefault();
						mutate();
					}}
				>
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
					<Button type="submit" disabled={!name || !email || !password}>
						Create Account
					</Button>
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
					<Button
						type="submit"
						variant="destructive"
						disabled={!name || !email || !password}
					>
						Error! Try Again
					</Button>
				</form>
			)}
		/>
	);
};
