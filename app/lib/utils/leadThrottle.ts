import type { NextRequest } from "next/server";
import prisma from "@/app/lib/config/db";

// Coarse anti-spam for public lead endpoints, in two layers:
//
// 1. Per IP, in memory — cheap, but per server instance only (on Vercel each
//    warm function instance keeps its own map, so it is best-effort).
// 2. Per identity, in MySQL — the same email or phone may create at most
//    IDENTITY_MAX leads per window. Shared by every instance, no schema change.
//
// Neither stops a botnet rotating IPs *and* identities; that needs a shared
// store (Upstash/Vercel KV) or a CAPTCHA — see the deploy checklist.

const WINDOW_MS = 10 * 60 * 1000;
const IP_MAX = 5;
const IDENTITY_MAX = 3;

const hitsByIp = new Map<string, number[]>();

export function requestIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

/** Records a hit for `ip`; true when it is over the per-instance limit. */
export function ipOverLimit(ip: string): boolean {
  const now = Date.now();
  const hits = (hitsByIp.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  const limited = hits.length >= IP_MAX;
  if (!limited) hits.push(now);
  hitsByIp.set(ip, hits);
  if (hitsByIp.size > 5000) {
    for (const [key, times] of hitsByIp) if (times.every((t) => now - t >= WINDOW_MS)) hitsByIp.delete(key);
  }
  return limited;
}

/**
 * True when this email or phone already created IDENTITY_MAX leads in the
 * window. Empty values are ignored (Contact/Join leads store email ""), so
 * they never match unrelated leads.
 */
export async function identityOverLimit(email: string, phoneNo: string): Promise<boolean> {
  const or = [
    ...(email.trim() ? [{ email: email.trim().toLowerCase() }] : []),
    ...(phoneNo.trim() ? [{ phoneNo: phoneNo.trim() }] : []),
  ];
  if (or.length === 0) return false;
  const since = new Date(Date.now() - WINDOW_MS);
  const recent = await prisma.lead.count({ where: { createdAt: { gte: since }, OR: or } });
  return recent >= IDENTITY_MAX;
}
