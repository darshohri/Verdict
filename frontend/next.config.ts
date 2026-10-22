import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const apiRewrites = process.env.NODE_ENV === "development"
      ? [
          {
            source: "/api/:path*",
            destination: "http://127.0.0.1:8000/api/:path*",
          },
        ]
      : [];

    return [
      ...apiRewrites,
      {
        source: "/__/auth/:path*",
        destination: "https://verdict-e40d2.firebaseapp.com/__/auth/:path*",
      },
    ];
  },
};

export default nextConfig;
