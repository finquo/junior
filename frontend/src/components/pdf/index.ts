import type { NodeInput, RenderOptions } from "takumi-pdf";
import { render } from "takumi-pdf/next";

export const getPDF = async (component: NodeInput, options?: RenderOptions) => {
	const pdf = await render(component, options);

	return new Response(pdf as BodyInit, {
		status: 200,
		headers: {
			"Content-Type": "application/pdf",
			"Content-Disposition": 'inline; filename="document.pdf"',
		},
	});
};
