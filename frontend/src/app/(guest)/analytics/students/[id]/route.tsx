import { call } from "@orpc/server";
import { analyticsRouter } from "backend/api";
import { getPDF } from "@/components/pdf";
import { PdfcnThemeProvider } from "@/components/pdf/theme-provider";
import { StudentReport } from "../_components/student-report";

export const dynamic = "force-dynamic";

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;
	const data = await call(analyticsRouter.studentReport, { id }, {});
	return await getPDF(
		<PdfcnThemeProvider theme={undefined}>
			<StudentReport data={data} />
		</PdfcnThemeProvider>,
	);
}
