"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { sileo as toast } from "sileo";
import {
	Frame,
	FrameDescription,
	FrameHeader,
	FramePanel,
	FrameTitle,
} from "@/components/reui/frame";
import { api, refetchAPIs } from "@/hooks/api";
import { MaterialForm } from "../_components/material-form";

export default function Page() {
	const router = useRouter();

	const { mutateAsync, isPending } = useMutation(
		api.core.material.create.mutationOptions({
			onSuccess: () => {
				refetchAPIs([api.core.material.list.queryKey()]);
				toast.success({ title: "Material created successfully" });
				router.push("/materials" as "/");
			},
			onError: (err: { message?: string }) => {
				toast.error({ title: err.message || "Failed to create material" });
			},
		}),
	);

	return (
		<Frame>
			<FrameHeader>
				<FrameTitle>Create Material</FrameTitle>
				<FrameDescription>
					Assign lessons and a shipping address for a student material order.
				</FrameDescription>
			</FrameHeader>
			<FramePanel>
				<MaterialForm
					isPending={isPending}
					onSubmit={async (value) => {
						await mutateAsync(value);
					}}
				/>
			</FramePanel>
		</Frame>
	);
}
