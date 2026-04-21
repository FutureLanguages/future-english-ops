import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: process.env.SERVER_ACTION_BODY_SIZE_LIMIT ?? "12mb",
    },
  },
};

export default nextConfig;
