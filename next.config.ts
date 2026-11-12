import type { NextConfig } from "next";

// Fail a Vercel *production* build that is missing required settings, or that
// would bake "http://localhost:3002" into the dashboard's "View live" links
// (NEXT_PUBLIC_* values are inlined at build time). Previews/local unaffected.
if (process.env.VERCEL_ENV === "production") {
  const required = ["DATABASE_URL", "JWT_SECRET", "REVALIDATE_SECRET", "JMT_FRONTEND_URL", "NEXT_PUBLIC_JMT_FRONTEND_URL"];
  const bad = required.filter((name) => {
    const value = process.env[name] ?? "";
    return !value.trim() || (name !== "DATABASE_URL" && /localhost|127\.0\.0\.1/.test(value));
  });
  if (bad.length > 0) {
    throw new Error(`[next.config] Production build is missing or has localhost values for: ${bad.join(", ")}`);
  }
}

const SECURITY_HEADERS = [
  // Belt-and-braces with app/robots.ts: the admin is never indexed, any deployment.
  { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "X-Frame-Options", value: "DENY" },
  // Framing/base/plugin lockdown. A script-src policy needs per-request nonces
  // (proxy.ts) and is tracked separately so it can't break the editor at launch.
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'",
  },
];

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
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
