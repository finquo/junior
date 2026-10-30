"use client";

import {
	Frame,
	FrameDescription,
	FrameHeader,
	FramePanel,
	FrameTitle,
} from "@/components/reui/frame";
import { NewPaymentForm } from "../_components/payment-form";

export default function Page() {
	return (
		<Frame>
			<FrameHeader>
				<FrameTitle>Record Payment</FrameTitle>
				<FrameDescription>
					Log an offline payment received from a student's parents
				</FrameDescription>
			</FrameHeader>
			<FramePanel>
				<NewPaymentForm />
			</FramePanel>
		</Frame>
	);
}
