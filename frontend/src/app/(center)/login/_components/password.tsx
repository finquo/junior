"use client";

import { useSearchParams } from "next/navigation";
import { type ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MutationButton } from "@/hooks/button";
import { getClientBaseUrl } from "@/hooks/url";
import { authClient } from "@/lib/auth";

export const PasswordLogin = ({ children }: { children?: ReactNode }) => {
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
					<div className="space-y-1">
						<Label htmlFor="email">Email</Label>
						<Input
							id="email"
							className="normal-case"
							type="email"
							placeholder="name@example.com"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
						/>
					</div>
					<div className="space-y-1">
						<Label htmlFor="password">Password</Label>
						<Input
							id="password"
							className="normal-case"
							type="password"
							placeholder="super-secret"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
						/>
					</div>
					<Button onClick={() => mutate()} disabled={!email || !password}>
						Sign In
					</Button>
					{children}
				</>
			)}
			isPending={<Button disabled>Signing In...</Button>}
			isError={
				<>
					<Button variant="destructive">Error! Try Again</Button>
					{children}
				</>
			}
			isSuccess={<Button variant="outline">Redirecting...</Button>}
		/>
	);
};
