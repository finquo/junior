"use client";

import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import {
	Frame,
	FrameActions,
	FrameDescription,
	FrameHeader,
	FramePanel,
	FrameTitle,
} from "@/components/reui/frame";
import { Button } from "@/components/ui/button";
import { NewPaymentForm } from "../_components/payment-form";

export default function Page() {
	return (
		<Frame>
			<FrameHeader>
				<FrameTitle>Record Payment</FrameTitle>
				<FrameDescription>
					Log an offline payment received from a student's parents
				</FrameDescription>
				<FrameActions>
					<Button asChild variant="outline">
						<Link href="/payments">
							<ArrowLeftIcon />
							List
						</Link>
					</Button>
				</FrameActions>
			</FrameHeader>
			<FramePanel>
				<NewPaymentForm />
			</FramePanel>
		</Frame>
	);
}
