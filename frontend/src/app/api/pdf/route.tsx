import { render } from "takumi-pdf/next";

export async function GET() {
	const pdf = await render(
		<div>
			<h1 className="font-bold text-2xl">Hello from PDF</h1>
			<p>Rendered directly from JSX and Tailwind CSS in Next.js.</p>
		</div>,
	);

	return new Response(pdf as BodyInit, {
		status: 200,
		headers: {
			"Content-Type": "application/pdf",
			"Content-Disposition": 'inline; filename="document.pdf"',
		},
	});
}
