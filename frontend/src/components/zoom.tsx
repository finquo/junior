"use client";

import { VideoIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";

export interface ZoomButtonProps
	extends Omit<ComponentProps<typeof Button>, "asChild"> {
	meetingLink?: string | null;
}

export function ZoomButton({
	meetingLink,
	className,
	children,
	...props
}: ZoomButtonProps) {
	return (
		<Button asChild size="sm" variant="outline" className={className} {...props}>
			<a
				href={meetingLink || "https://zoom.us/join"}
				target="_blank"
				rel="noreferrer"
			>
				<VideoIcon className="size-4" />
				{children ?? "Join Zoom Meeting"}
			</a>
		</Button>
	);
}

export const ZoomMeetingButton = ZoomButton;
export const JoinZoomButton = ZoomButton;
export default ZoomButton;