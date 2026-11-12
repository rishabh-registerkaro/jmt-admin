import type { MetadataRoute } from "next";

// The CMS is never a search result: block every crawler from every path, on
// every deployment (production and Vercel previews). next.config.ts also sends
// X-Robots-Tag: noindex on every response, and app/layout.tsx a robots meta.
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", disallow: "/" } };
}
