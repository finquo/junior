import { call } from "@orpc/server";
import { analyticsRouter } from "backend/api";
import { getPDF } from "@/components/pdf";
import { PdfcnThemeProvider } from "@/components/pdf/theme-provider";
import { SlotSummaryReport } from "../_components/slot-summary-report";

export const dynamic = "force-dynamic";

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;
	const data = await call(analyticsRouter.slotReport, { id }, {});
	return await getPDF(
		<PdfcnThemeProvider theme={undefined}>
			<SlotSummaryReport data={data} />
		</PdfcnThemeProvider>,
	);
}
