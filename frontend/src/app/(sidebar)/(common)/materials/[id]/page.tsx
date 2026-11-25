"use client";

import { useParams } from "next/navigation";
import {
	Frame,
	FrameDescription,
	FrameHeader,
	FramePanel,
	FrameTitle,
} from "@/components/reui/frame";
import { api } from "@/hooks/api";
import { LoadQuery } from "@/hooks/load";
import { MaterialProfile } from "../_components/profile";

export default function Page() {
	const id = useParams<{ id: string }>().id;

	return (
		<LoadQuery
			label="Material"
			api={api.core.material.get.queryOptions({ input: { id } })}
		>
			{(data) => (
				<Frame>
					<FrameHeader>
						<FrameTitle>{data.name}</FrameTitle>
						<FrameDescription>Material order details</FrameDescription>
					</FrameHeader>
					<FramePanel>
						<MaterialProfile data={data} />
					</FramePanel>
				</Frame>
			)}
		</LoadQuery>
	);
}
