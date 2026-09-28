import { varlockNextConfigPlugin } from "@varlock/nextjs-integration/plugin";
import type { NextConfig } from "next";
import { withPwa } from "./pwa.config";

const withVarlock = varlockNextConfigPlugin();

const nextConfig: NextConfig = {
	output: "export",
	trailingSlash: true,
	typedRoutes: true,
	reactCompiler: true,
	transpilePackages: ["backend"],
};

export default withVarlock(withPwa(nextConfig));
