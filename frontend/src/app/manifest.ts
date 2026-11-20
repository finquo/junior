import { socials } from "@/lib/social";
import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: socials.name,
		short_name: socials.name,
		description: socials.description,
		start_url: "/",
		display: "standalone",
		background_color: "#ffffff",
		theme_color: "#000000",
		icons: [
			{
				src: "/favicon.png",
				sizes: "200x200",
				type: "image/png",
			},
		],
	};
}
