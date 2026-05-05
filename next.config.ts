import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/bureau-d-etude-thermique",
        destination: "/bureau-d-etude-renovation-energetique",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
