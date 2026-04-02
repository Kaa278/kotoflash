import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.CAPACITOR_BUILD === "true" ? "export" : undefined,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
