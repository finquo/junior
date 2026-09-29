"use client";

import { InfoIcon } from "lucide-react";
import {
	Alert,
	AlertAction,
	AlertDescription,
	AlertTitle,
} from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
					<Button size={"xs"} variant="outline">
						Turn Off
					</Button>
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
