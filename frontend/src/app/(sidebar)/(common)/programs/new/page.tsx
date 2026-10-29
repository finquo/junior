import {
	Frame,
	FrameDescription,
	FrameHeader,
	FramePanel,
	FrameTitle,
} from "@/components/reui/frame";
import { CreateProgramForm } from "../[id]/_components/create-form";

export default function Page() {
	return (
		<Frame>
			<FrameHeader>
				<FrameTitle>Create Program</FrameTitle>
				<FrameDescription>
					Define the program details and regional pricing
				</FrameDescription>
			</FrameHeader>
			<FramePanel>
				<CreateProgramForm />
			</FramePanel>
		</Frame>
	);
}
