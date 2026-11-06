import { call } from "@orpc/server";
import { analyticsRouter } from "backend/api";
import { getPDF } from "@/components/pdf";
import { PdfcnThemeProvider } from "@/components/pdf/theme-provider";
import { SlotSummaryReport } from "../_components/slot-summary-report";

export const dynamic = "force-dynamic";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;
	const source =
		new URL(request.url).searchParams.get("source") === "chunks"
			? "chunks"
			: "main";
	const data = await call(analyticsRouter.slotReport, { id, source }, {});
	return await getPDF(
		<PdfcnThemeProvider theme={undefined}>
			<SlotSummaryReport data={data} />
		</PdfcnThemeProvider>,
	);
}
