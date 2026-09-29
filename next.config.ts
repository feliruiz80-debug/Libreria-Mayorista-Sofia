import { execSync } from "node:child_process";
import type { NextConfig } from "next";

function appVersion(): string {
  const fromDeploy =
    process.env.VERCEL_DEPLOYMENT_ID ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.GITHUB_SHA;
  if (fromDeploy) return fromDeploy;
  try {
    return execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
  } catch {
    return "sofia";
  }
}

const version = appVersion();
process.env.NEXT_PUBLIC_APP_VERSION = version;

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: version,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.mayoristasofia.com.ar",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
