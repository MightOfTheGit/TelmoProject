import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: "/TelmoProject",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
