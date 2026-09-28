import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
