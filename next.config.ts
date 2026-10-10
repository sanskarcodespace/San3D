import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Resolve product metadata before streaming so missing slugs return HTTP 404.
  htmlLimitedBots: /.*/,
  images: {
    remotePatterns: process.env.NEXT_PUBLIC_SUPABASE_URL
      ? [
          {
            protocol: "https",
            hostname: new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname,
            pathname: "/storage/v1/object/public/catalogue-images/**",
          },
        ]
      : [],
  },
  poweredByHeader: false,
  turbopack: { root: __dirname },
};

export default nextConfig;
