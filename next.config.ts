import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@blocknote/react",
    "@blocknote/core",
    "@blocknote/shadcn",
    "@blocknote/server-util",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },
};

export default nextConfig;
