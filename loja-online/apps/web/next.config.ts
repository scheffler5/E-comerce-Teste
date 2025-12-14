import type { NextConfig } from "next";

images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: '*.amazonaws.com',
    },
  ],
  },
};

export default nextConfig;
