import { call } from "@orpc/server";
import { analyticsRouter } from "backend/api";
import { getPDF } from "@/components/pdf";
import { ReportTemplateFrame } from "../_components/layouter";
import type { BaseReportData } from "../_components/types";

export const dynamic = "force-dynamic";

export async function GET() {
	const data = await call(analyticsRouter.demo, undefined, {});
	return await getPDF(
		<ReportTemplateFrame
			theme={undefined}
			data={data as unknown as BaseReportData}
			titlePrefix="Growth Report"
			statusLabel="Growth: Strong"
			statusTone="success"
			graphVariant="bar"
			graphTitle="Pipeline build by week"
			graphSubtitle="Demand creation output trend"
			graphLegend="none"
			graphShowValues
			graphColors={["#0EA5E9"]}
		/>,
	);
}
