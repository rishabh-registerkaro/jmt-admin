import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hostinger's container reports the host machine's full CPU count (63), so
  // Next tries to spawn 63 build workers and hits the container's thread limit
  // ("OS can't spawn worker thread: Resource temporarily unavailable").
  // Pin it to the cores the plan actually provides.
  experimental: {
    cpus: 2,
  },
  images: {
    unoptimized: true,
  remotePatterns: [
      {
        protocol: "https",
        hostname: "navajowhite-octopus-630288.hostingersite.com",
      },
    ],
  },
};

export default nextConfig;
