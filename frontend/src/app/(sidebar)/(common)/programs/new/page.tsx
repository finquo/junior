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
import { CreateProgramForm } from "../[id]/_components/create-form";

export default function Page() {
	return (
		<Frame>
			<FrameHeader>
				<FrameTitle>Create Program</FrameTitle>
				<FrameDescription>
					Define the program details and regional pricing
				</FrameDescription>
				<FrameActions>
					<Button asChild variant="outline">
						<Link href="/programs">
							<ArrowLeftIcon />
							List
						</Link>
					</Button>
				</FrameActions>
			</FrameHeader>
			<FramePanel>
				<CreateProgramForm />
			</FramePanel>
		</Frame>
	);
}
