import { varlockNextConfigPlugin } from "@varlock/nextjs-integration/plugin";
import type { NextConfig } from "next";
import { withPwa } from "./pwa.config";

const withVarlock = varlockNextConfigPlugin();

const nextConfig: NextConfig = {
	output: process.env.EXPORT ? "export" : "standalone",
	trailingSlash: true,
	skipTrailingSlashRedirect: true,
	typedRoutes: true,
	reactCompiler: true,
	transpilePackages: ["backend"],
};

// export default nextConfig;
export default withVarlock(withPwa(nextConfig));
