import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable experimental features for Inngest
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  // Redirect OAuth callback to match existing OAuth client config
  async redirects() {
    return [
      {
        source: "/oauth/callback",
        destination: "/api/google/callback",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
