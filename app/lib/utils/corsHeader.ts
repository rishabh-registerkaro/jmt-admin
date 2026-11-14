import { NextRequest } from "next/server";

// Env values pasted into hosting dashboards often carry quotes, whitespace or
// a trailing slash; an Origin header never does, so normalize before comparing.
const normalizeOrigin = (v: string | undefined) =>
  (v ?? "").trim().replace(/^['"]|['"]$/g, "").trim().replace(/\/+$/, "");

const allowedOrigins = [
  normalizeOrigin(process.env.PRODUCTION_URL)
].filter(Boolean);

export function getCorsHeaders(req: NextRequest): Record<string, string> {
  const origin = req.headers.get("origin") || "";

  const isLocalhost =
    /^http:\/\/localhost(:\d+)?$/.test(origin) ||
    /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin);

  const isAllowed =
    allowedOrigins.includes(origin) || isLocalhost;

  // No Allow-Origin at all for other origins (an empty value is invalid).
  return {
    ...(isAllowed ? { "Access-Control-Allow-Origin": origin } : {}),
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}
