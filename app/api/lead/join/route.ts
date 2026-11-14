import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import prisma from "@/app/lib/config/db";
import { hasSharedSecret, identityOverLimit } from "@/app/lib/utils/leadThrottle";
import { sendLeadNotification } from "@/app/lib/config/email";
import {
  EMPTY_JOIN_VALUES,
  HONEYPOT_FIELD,
  JOIN_LEAD_SOURCE,
  readJoinValues,
  validateJoin,
  type JoinFormState,
} from "@/utils/joinForm";

// POST /api/lead/join — the Joy Maa Tara "Join our crew" worker application.
//
// Called server-to-server by the jmt-frontend Server Action
// (jmt-frontend/app/actions/joinApplication.ts) with the form as
// multipart/form-data. Always answers with a JoinFormState JSON body.
//
// Same storage and safeguards as /api/lead/contact: one row in `leads` (name
// and phone in columns, the rest in `formData`, lead source "Join our crew —
// Worker application" so applications are easy to filter), an email to the
// admin, and a per-visitor rate limit. There is no email field, so the email
// column is left empty.

const NOTIFY_TIMEOUT_MS = 8000;

/** Header jmt-frontend uses to pass on the visitor's IP (POST rejects requests without the secret). */
const CLIENT_IP_HEADER = "x-jmt-client-ip";

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const recentSubmissions = new Map<string, number[]>();

function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get(CLIENT_IP_HEADER)?.trim();
  if (forwarded) return forwarded;
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const hits = (recentSubmissions.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (hits.length >= RATE_LIMIT_MAX) {
    recentSubmissions.set(ip, hits);
    return true;
  }
  hits.push(now);
  recentSubmissions.set(ip, hits);
  if (recentSubmissions.size > 5000) {
    for (const [key, times] of recentSubmissions) {
      if (times.every((t) => now - t >= RATE_LIMIT_WINDOW_MS)) recentSubmissions.delete(key);
    }
  }
  return false;
}

function successState(): JoinFormState {
  return {
    status: "success",
    message: "Thanks — your application is in. We’ll call you within 2 working days.",
    fieldErrors: {},
    values: EMPTY_JOIN_VALUES,
  };
}

const reply = (state: JoinFormState, status = 200) => NextResponse.json(state, { status });

export async function POST(req: NextRequest) {
  // Only jmt-frontend's server may post here; it proves itself with the shared secret.
  if (!hasSharedSecret(req)) {
    return reply(
      {
        status: "error",
        message: "We couldn't send your application just now. Please try again, or call or WhatsApp us directly.",
        fieldErrors: {},
        values: EMPTY_JOIN_VALUES,
      },
      401,
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return reply(
      {
        status: "error",
        message: "We couldn't read your application. Please try again.",
        fieldErrors: {},
        values: EMPTY_JOIN_VALUES,
      },
      400,
    );
  }

  // Bots fill every field; pretend success so they don't retry.
  const honeypot = formData.get(HONEYPOT_FIELD);
  if (typeof honeypot === "string" && honeypot.trim() !== "") {
    return reply(successState());
  }

  const values = readJoinValues(formData);
  const fieldErrors = validateJoin(values);
  if (Object.keys(fieldErrors).length > 0) {
    return reply({ status: "error", message: "Please check the highlighted fields.", fieldErrors, values }, 400);
  }

  // In-memory per IP (one instance) + per phone in MySQL (all instances).
  if (isRateLimited(clientIp(req)) || (await identityOverLimit("", values.phone).catch(() => false))) {
    return reply(
      {
        status: "error",
        message:
          "You've sent several applications in a short time. Please wait a few minutes, or call or WhatsApp us directly.",
        fieldErrors: {},
        values,
      },
      429,
    );
  }

  const details: Record<string, string> = {
    Trade: values.trade,
    Experience: values.experience,
    "District or town": values.location,
    Languages: values.languages,
    "Can start": values.start,
    "OK to call or WhatsApp": values.consent === "yes" ? "Yes" : "",
  };
  const leadFormData = Object.fromEntries(
    Object.entries(details).filter(([, value]) => value !== ""),
  ) satisfies Prisma.InputJsonObject;

  try {
    const lead = await prisma.lead.create({
      data: {
        name: values.name,
        email: "",
        phoneNo: values.phone,
        leadSource: JOIN_LEAD_SOURCE,
        formData: leadFormData,
        status: "new",
      },
    });

    // Wait briefly so serverless hosts don't cut the email off, but never let
    // a slow mail server delay the applicant.
    await Promise.race([
      sendLeadNotification({
        name: lead.name,
        email: "Not provided",
        phoneNo: lead.phoneNo,
        leadSource: lead.leadSource,
        formData: leadFormData,
        createdAt: lead.createdAt,
      }),
      new Promise((resolve) => setTimeout(resolve, NOTIFY_TIMEOUT_MS)),
    ]);

    return reply(successState());
  } catch (error) {
    console.error("[join] Failed to save application:", error);
    return reply(
      {
        status: "error",
        message: "We couldn't send your application just now. Please try again, or call or WhatsApp us directly.",
        fieldErrors: {},
        values,
      },
      500,
    );
  }
}
