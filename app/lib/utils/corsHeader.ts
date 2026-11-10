import { NextRequest } from "next/server";
const allowedOrigins = [
  process.env.PRODUCTION_URL
];
export function getCorsHeaders(req: NextRequest) {
  const origin = req.headers.get("origin") || "";

  const isLocalhost =
    /^http:\/\/localhost(:\d+)?$/.test(origin) ||
    /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin);

  const isAllowed =
    allowedOrigins.includes(origin) || isLocalhost;

  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : "",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}