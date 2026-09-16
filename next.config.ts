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
        destination: "/nos-prestations",
        permanent: true,
      },
      {
        source: "/bureau-d-etude-renovation-energetique",
        destination: "/nos-prestations",
        permanent: true,
      },
      {
        source: "/audit-energetique",
        destination: "/audit-energetique-paris",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
