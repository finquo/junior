import type { NextConfig } from "next";
import { withPwa } from "./pwa.config";

const nextConfig: NextConfig = {
	trailingSlash: true,
	skipTrailingSlashRedirect: true,
	typedRoutes: true,
	reactCompiler: true,
	transpilePackages: ["backend"],
	images: { unoptimized: true },
	allowedDevOrigins: ["192.168.*.*"],
};

export default withPwa(nextConfig);
