"use client";

import { useQueryState } from "nuqs";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { MutationButton } from "@/hooks/button";
import { getClientBaseUrl } from "@/hooks/url";
import { authClient } from "@/lib/auth";

export const PasswordLogin = () => {
	const [email, setEmail] = useQueryState("email", { defaultValue: "" });
	const [password, setPassword] = useQueryState("password", {
		defaultValue: "",
	});
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
			isSuccess={<Button variant="outline">Redirecting...</Button>}
			reTry={(mutate) => (
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
								type="text"
								placeholder="super-secret"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
							/>
						</Field>
					</FieldGroup>
					<Button
						variant="destructive"
						onClick={() => mutate()}
						disabled={!email || !password}
					>
						Error! Try Again
					</Button>
				</>
			)}
		/>
	);
};
