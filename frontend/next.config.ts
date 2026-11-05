import { varlockNextConfigPlugin } from "@varlock/nextjs-integration/plugin";
import type { NextConfig } from "next";
import { withPwa } from "./pwa.config";

const withVarlock = varlockNextConfigPlugin();

const nextConfig: NextConfig = {
	output: "standalone",
	trailingSlash: true,
	skipTrailingSlashRedirect: true,
	typedRoutes: true,
	reactCompiler: true,
	transpilePackages: ["backend"],
	// serverExternalPackages: [
	// 	"@takumi-rs/core",
	// 	"@takumi-rs/wasm",
	// 	"@takumi-rs/helpers",
	// ],
	images: { unoptimized: true },
	allowedDevOrigins: ["192.168.*.*"],
	webpack: (config) => {
		config.experiments = {
			...config.experiments,
			asyncWebAssembly: true,
			syncWebAssembly: true,
		};
		return config;
	},
};

// export default nextConfig;
export default withVarlock(withPwa(nextConfig));
