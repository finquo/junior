export default async function ({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	return (
		<iframe title="PDF" src={`/students/${id}/pdf`} className="h-full w-full" />
	);
}
