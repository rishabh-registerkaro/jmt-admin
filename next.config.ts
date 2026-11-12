import type { NextConfig } from "next";

// Check a Vercel *production* build's settings. Previews/local unaffected.
//  • Secrets the admin cannot run without → fail the build.
//  • Frontend URLs → only warn. The code falls back to http://localhost:3002,
//    so a missing value just breaks "View live" links and cache refreshes
//    (NEXT_PUBLIC_* values are inlined at build time — rebuild after setting).
if (process.env.VERCEL_ENV === "production") {
  const isBad = (name: string, allowLocalhost = false) => {
    const value = process.env[name] ?? "";
    return !value.trim() || (!allowLocalhost && /localhost|127\.0\.0\.1/.test(value));
  };

  const missingSecrets = ["DATABASE_URL", "JWT_SECRET", "REVALIDATE_SECRET"].filter((name) =>
    isBad(name, name === "DATABASE_URL"),
  );
  if (missingSecrets.length > 0) {
    throw new Error(`[next.config] Production build is missing or has localhost values for: ${missingSecrets.join(", ")}`);
  }

  const badUrls = ["JMT_FRONTEND_URL", "NEXT_PUBLIC_JMT_FRONTEND_URL"].filter((name) => isBad(name));
  if (badUrls.length > 0) {
    console.warn(
      `[next.config] WARNING: ${badUrls.join(", ")} missing or set to localhost. ` +
        `"View live" links and frontend cache refreshes will not work until they point at the live frontend URL.`,
    );
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
