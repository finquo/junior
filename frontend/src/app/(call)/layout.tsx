import Script from "next/script";
import "@/components/arc/foundation.css";

export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<Script src="/coi-serviceworker.js" />
			<div className="grid h-svh grid-rows-[1fr] overflow-hidden">
				{children}
			</div>
		</>
	);
}
