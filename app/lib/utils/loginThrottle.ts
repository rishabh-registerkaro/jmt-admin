// Brute-force protection for POST /api/auth/login: failed attempts are counted
// per account identifier (lower-cased email/username) and per client IP.
//
// In memory, so it is PER SERVER INSTANCE only (on Vercel each warm function
// instance keeps its own maps and they reset on cold start) — best-effort, the
// same trade-off as leadThrottle.ts. A hard guarantee needs a shared store
// (Upstash/Vercel KV).
//
// Identifiers are counted whether or not the account exists, so the limiter
// answers the same for real and made-up accounts.

const WINDOW_MS = 15 * 60 * 1000;
const IDENTIFIER_MAX = 5;
const IP_MAX = 20;
const MAX_KEYS = 5000;

const failuresByIdentifier = new Map<string, number[]>();
const failuresByIp = new Map<string, number[]>();

export type LoginAttempt = { identifier: string; ip: string; at: number };

/**
 * Throttle key for an account: lower-cased, trimmed, length-capped, email and
 * username kept apart. Normalised BEFORE the prefix is added, the same way the
 * login route looks the email up, so " a@x.com" and "a@x.com" share a bucket.
 */
export function loginIdentifier(email: unknown, username: unknown): string {
  const value = String(email ? email : username).toLowerCase().trim();
  return `${email ? "e" : "u"}:${value}`.slice(0, 256);
}

function recent(map: Map<string, number[]>, key: string, now: number): number[] {
  return (map.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
}

/** Seconds until the oldest counted failure leaves the window. */
function retryAfter(hits: number[], now: number): number {
  return Math.max(1, Math.ceil((hits[0] + WINDOW_MS - now) / 1000));
}

function record(map: Map<string, number[]>, key: string, hits: number[], now: number) {
  hits.push(now);
  map.delete(key); // re-insert so the map stays ordered by last activity
  map.set(key, hits);
  if (map.size > MAX_KEYS) {
    for (const [k, times] of map) if (times.every((t) => now - t >= WINDOW_MS)) map.delete(k);
    // Still full of live entries: drop the least recently active ones.
    for (const k of map.keys()) {
      if (map.size <= MAX_KEYS) break;
      map.delete(k);
    }
  }
}

function forget(map: Map<string, number[]>, key: string, at: number) {
  const hits = (map.get(key) ?? []).filter((t) => t !== at);
  if (hits.length) map.set(key, hits);
  else map.delete(key);
}

/**
 * Call BEFORE checking the password. Over the limit: returns the Retry-After
 * seconds and records nothing. Otherwise counts this attempt as a failure up
 * front (so parallel requests cannot slip past the limit) and returns it; call
 * loginSucceeded / releaseLoginAttempt to take it back.
 */
export function beginLoginAttempt(identifier: string, ip: string): { retryAfter: number } | LoginAttempt {
  const now = Date.now();
  const idHits = recent(failuresByIdentifier, identifier, now);
  if (idHits.length >= IDENTIFIER_MAX) return { retryAfter: retryAfter(idHits, now) };

  // Without a proxy header every client would share the "unknown" bucket and
  // 20 bad logins would lock everybody out, so that bucket is not counted.
  const countIp = ip !== "unknown";
  const ipHits = countIp ? recent(failuresByIp, ip, now) : [];
  if (ipHits.length >= IP_MAX) return { retryAfter: retryAfter(ipHits, now) };

  record(failuresByIdentifier, identifier, idHits, now);
  if (countIp) record(failuresByIp, ip, ipHits, now);
  return { identifier, ip, at: now };
}

/** Successful login: clears the identifier counter and un-counts this attempt for the IP. */
export function loginSucceeded(attempt: LoginAttempt) {
  failuresByIdentifier.delete(attempt.identifier);
  forget(failuresByIp, attempt.ip, attempt.at);
}

/** The attempt never reached a verdict (server error): do not hold it against the client. */
export function releaseLoginAttempt(attempt: LoginAttempt) {
  forget(failuresByIdentifier, attempt.identifier, attempt.at);
  forget(failuresByIp, attempt.ip, attempt.at);
}
