import { googleFonts } from "@takumi-rs/helpers";
import type { NodeInput, RenderOptions } from "takumi-pdf";
import { render } from "takumi-pdf/next";

export const getPDF = async (
	component: NodeInput,
	options?: RenderOptions,
): Promise<Response> => {
	try {
		const pdf = await render(component, {
			fonts: await googleFonts(["Inter"]),
			fontFamilies: ["Inter", "sans-serif"],
			...options,
		});

		return new Response(pdf as BodyInit, {
			status: 200,
			headers: {
				"Content-Type": "application/pdf",
				"Content-Disposition": 'inline; filename="document.pdf"',
			},
		});
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Failed to render the PDF";

		return Response.json({ error: message }, { status: 500 });
	}
};
