// import { render } from "takumi-pdf/next";
// import { SlotSummaryPdf } from "../_components/slot-summary-pdf";

export const dynamic = "force-dynamic";

export async function GET(
	req: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	// const { id: slotId } = await params;

	// let summary: SlotSummary;
	// try {
	// 	const download = await call(
	// 		api.media.download,
	// 		{
	// 			id: slotId,
	// 			path: "summary/main.json",
	// 		},
	// 		{ context: { req } },
	// 	);

	// 	const res = await fetch(download.url);
	// 	if (!res.ok) {
	// 		return new Response("Failed to load session summary", { status: 502 });
	// 	}

	// 	summary = (await res.json()) as SlotSummary;
	// } catch {
	return new Response("Session summary not available", { status: 404 });
	// }
	// const generatedAt = new Date().toLocaleDateString("en-US", {
	// 	day: "numeric",
	// 	month: "long",
	// 	year: "numeric",
	// });

	// const pdf = await render(
	// 	<SlotSummaryPdf
	// 		summary={summary}
	// 		slotId={slotId}
	// 		generatedAt={generatedAt}
	// 	/>,
	// );

	// return new Response(pdf as BodyInit, {
	// 	status: 200,
	// 	headers: {
	// 		"Content-Type": "application/pdf",
	// 		"Content-Disposition": `inline; filename="slot-${slotId}-summary.pdf"`,
	// 	},
	// });
}
