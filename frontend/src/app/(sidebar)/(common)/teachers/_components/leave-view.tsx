"use client";

import type { LeaveRangeOutput } from "backend/config";
import { PlaneIcon } from "lucide-react";
import { ColorBadge } from "@/components/ui/badge";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import {
	Item,
	ItemContent,
	ItemDescription,
	ItemGroup,
	ItemMedia,
	ItemTitle,
} from "@/components/ui/item";
import { ScrollArea } from "@/components/ui/scroll-area";

export function LeaveView({ leaves }: { leaves: LeaveRangeOutput[] }) {
	if (leaves.length === 0) {
		return (
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<PlaneIcon />
					</EmptyMedia>
					<EmptyTitle>No leaves recorded</EmptyTitle>
					<EmptyDescription>
						This teacher has no leave on record.
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		);
	}

	return (
		<ScrollArea className="max-h-96">
			<ItemGroup>
				{leaves.map((leave) => (
					<Item
						key={`${leave.start.toISOString()}-${leave.end.toISOString()}`}
						variant="outline"
					>
						<ItemMedia variant="icon">
							<PlaneIcon />
						</ItemMedia>
						<ItemContent>
							<ItemTitle>
								{leave.start.toLocaleString()} → {leave.end.toLocaleString()}
							</ItemTitle>
							<ItemDescription>
								{leave.type === "partial"
									? "Partial day leave"
									: leave.type === "full"
										? "Full day leave"
										: "Multi-day leave"}
							</ItemDescription>
						</ItemContent>
						<ColorBadge>
							{leave.type.charAt(0).toUpperCase() + leave.type.slice(1)}
						</ColorBadge>
					</Item>
				))}
			</ItemGroup>
		</ScrollArea>
	);
}
