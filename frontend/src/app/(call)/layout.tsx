export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<div className="grid h-svh grid-rows-[1fr] overflow-hidden">{children}</div>
	);
}
