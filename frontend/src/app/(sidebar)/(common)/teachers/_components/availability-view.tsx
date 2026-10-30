"use client";

import { type Availability, dayKeys } from "backend/config";
import { CalendarDaysIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import {
	Item,
	ItemActions,
	ItemContent,
	ItemGroup,
	ItemMedia,
	ItemTitle,
} from "@/components/ui/item";

export function AvailabilityView({
	availability,
}: {
	availability: Availability | null;
}) {
	if (!availability) {
		return (
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<CalendarDaysIcon />
					</EmptyMedia>
					<EmptyTitle>No availability set</EmptyTitle>
					<EmptyDescription>
						Availability has not been configured for this teacher.
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		);
	}

	return (
		<ItemGroup>
			{dayKeys.map((day) => {
				const config = availability[day];
				const ranges = config?.ranges ?? [];
				return (
					<Item key={day} variant="outline">
						<ItemMedia variant="icon">
							<CalendarDaysIcon />
						</ItemMedia>
						<ItemContent>
							<ItemTitle className="capitalize">{day}</ItemTitle>
						</ItemContent>
						{config?.enabled && ranges.length > 0 ? (
							<ItemActions className="flex-col items-end gap-1">
								{ranges.map((range) => (
									<Badge key={`${range.start}-${range.end}`} variant="success">
										{range.start} – {range.end}
									</Badge>
								))}
							</ItemActions>
						) : (
							<Badge variant="outline">Off</Badge>
						)}
					</Item>
				);
			})}
		</ItemGroup>
	);
}
