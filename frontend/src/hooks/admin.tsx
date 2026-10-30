"use client";

import { Slot } from "@radix-ui/react-slot";
import { useMutation } from "@tanstack/react-query";
import { InfoIcon } from "lucide-react";
import { sileo as toast } from "sileo";
import {
	Alert,
	AlertAction,
	AlertDescription,
	AlertTitle,
} from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { authClient } from "@/hooks/auth";
import { useAuth } from "./auth";

export const ImpersonationBanner = () => {
	const { impersonation, data } = useAuth();

	if (!impersonation) return;

	return (
		<div className="fixed right-1/2 bottom-4 translate-x-1/2">
			<Alert variant="warning" className="w-sm">
				<InfoIcon />
				<AlertTitle>You’re viewing as a {data?.role}!</AlertTitle>
				<AlertDescription>
					Any actions you take will be performed as this user.
					<br />
					Tap to stop impersonating and return to your account.
				</AlertDescription>
				<AlertAction>
					<StopImpersonateButton asChild>
						<Button size={"xs"} variant="outline">
							Turn Off
						</Button>
					</StopImpersonateButton>
				</AlertAction>
			</Alert>
		</div>
	);
};

export const ImpersonationHeader = () => {
	const { impersonation, data } = useAuth();

	if (!impersonation) return;

	return (
		<Badge variant={"orange"}>
			<InfoIcon />
			You’re viewing as a {data?.role}
		</Badge>
	);
};

export function ImpersonateButton({
	userId,
	asChild,
	children,
	...props
}: {
	userId: string;
	asChild?: boolean;
	children?: React.ReactNode;
} & React.ComponentProps<typeof Button>) {
	const { mutate: impersonate, isPending: isImpersonating } = useMutation({
		mutationKey: ["impersonating-user", userId],
		mutationFn: async () => {
			return await authClient.admin.impersonateUser(
				{
					userId,
				},
				{
					throw: true,
				},
			);
		},
		onSuccess: (data) => {
			toast.success({
				title: `You're viewing as a ${data?.user?.role ?? "user"}!`,
				description: "Any actions you take will be performed as this user.",
			});
		},
		onError: (err) => {
			toast.error({
				title: (err as Error)?.message || "Failed to impersonate user",
			});
		},
	});

	const Comp = asChild ? Slot : Button;

	return (
		<Comp disabled={isImpersonating} onClick={() => impersonate()} {...props}>
			{children}
		</Comp>
	);
}
export function StopImpersonateButton({
	asChild,
	children,
	...props
}: {
	asChild?: boolean;
	children?: React.ReactNode;
} & React.ComponentProps<typeof Button>) {
	const { mutate: stopImpersonating, isPending: isStopping } = useMutation({
		mutationKey: ["stop-impersonating"],
		mutationFn: async () => {
			return await authClient.admin.stopImpersonating(
				{},
				{
					throw: true,
				},
			);
		},
		onSuccess: () => {
			toast.success({
				title: "You're back to your role",
			});
		},
		onError: (err) => {
			toast.error({
				title: (err as Error)?.message || "Failed to stop impersonating",
			});
		},
	});

	const Comp = asChild ? Slot : Button;

	return (
		<Comp disabled={isStopping} onClick={() => stopImpersonating()} {...props}>
			{children}
		</Comp>
	);
}
