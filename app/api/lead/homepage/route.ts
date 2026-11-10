import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import prisma from "@/app/lib/config/db";
import { sendLeadNotification } from "@/app/lib/config/email";
import { normalizeSecret } from "@/app/lib/utils/revalidateFrontend";
import {
  EMPTY_LEAD_VALUES,
  HONEYPOT_FIELD,
  LEAD_SOURCE,
  readLeadValues,
  validateLead,
} from "@/utils/leadForm";
import type { LeadFormState } from "@/types/homepage";

// POST /api/lead/homepage — the Joy Maa Tara homepage "Request workers" form.
//
// Called server-to-server by the jmt-frontend Server Action
// (jmt-frontend/app/actions/leads.ts) with the form as multipart/form-data.
// Always answers with a LeadFormState JSON body, which the form renders as is.
//
// Shape matches what the dashboard already understands (app/types/lead.ts):
// common fields in columns, form-specific answers in `formData` as
// {"Field Label": value} pairs. The form collects no email, so `email` is
// stored empty — the dashboard shows phone as the contact.

const NOTIFY_TIMEOUT_MS = 8000;

/** Header jmt-frontend uses to pass on the visitor's IP (trusted only with the secret). */
const CLIENT_IP_HEADER = "x-jmt-client-ip";

// Per-IP throttle: the form is public and every lead sends an email, so cap
// how fast one client can create them. In-memory is fine for a single Node
// instance (Hostinger); it resets on restart.
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const recentSubmissions = new Map<string, number[]>();

/**
 * The visitor's IP. jmt-frontend calls this route from its server, so the
 * connecting address is the frontend's; it forwards the real one in
 * CLIENT_IP_HEADER, which is only believed when the shared secret matches —
 * otherwise anyone could rotate the header to dodge the rate limit.
 */
function clientIp(req: NextRequest): string {
  const expected = normalizeSecret(process.env.REVALIDATE_SECRET);
  const provided = normalizeSecret(req.headers.get("x-revalidate-secret"));
  if (expected && provided === expected) {
    const forwarded = req.headers.get(CLIENT_IP_HEADER)?.trim();
    if (forwarded) return forwarded;
  }
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
  // Keep the map from growing without bound.
  if (recentSubmissions.size > 5000) {
    for (const [key, times] of recentSubmissions) {
      if (times.every((t) => now - t >= RATE_LIMIT_WINDOW_MS)) recentSubmissions.delete(key);
    }
  }
  return false;
}

function successState(): LeadFormState {
  return {
    status: "success",
    message: "Thanks — your requirement is in. The owner will call you back within 24 hours.",
    fieldErrors: {},
    values: EMPTY_LEAD_VALUES,
  };
}

const reply = (state: LeadFormState, status = 200) => NextResponse.json(state, { status });

export async function POST(req: NextRequest) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return reply(
      {
        status: "error",
        message: "We couldn't read your request. Please try again.",
        fieldErrors: {},
        values: EMPTY_LEAD_VALUES,
      },
      400,
    );
  }

  // Bots fill every field; pretend success so they don't retry.
  const honeypot = formData.get(HONEYPOT_FIELD);
  if (typeof honeypot === "string" && honeypot.trim() !== "") {
    return reply(successState());
  }

  const values = readLeadValues(formData);
  const fieldErrors = validateLead(values);
  if (Object.keys(fieldErrors).length > 0) {
    return reply(
      {
        status: "error",
        message: "Please check the highlighted fields.",
        fieldErrors,
        values,
      },
      400,
    );
  }

  if (isRateLimited(clientIp(req))) {
    return reply(
      {
        status: "error",
        message:
          "You've sent several requests in a short time. Please wait a few minutes, or call or WhatsApp us directly.",
        fieldErrors: {},
        values,
      },
      429,
    );
  }

  const details: Record<string, string> = {
    "Company name": values.companyName,
    "Site location": values.siteLocation,
    Headcount: values.headcount,
    "Start date": values.startDate,
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
        leadSource: LEAD_SOURCE,
        formData: leadFormData,
        status: "new",
      },
    });

    // Same pattern as POST /api/lead: wait briefly so serverless hosts don't
    // cut the email off, but never let a slow mail server delay the visitor.
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
    console.error("[homepage] Failed to save lead:", error);
    return reply(
      {
        status: "error",
        message:
          "We couldn't send your request just now. Please try again, or call or WhatsApp us directly.",
        fieldErrors: {},
        values,
      },
      500,
    );
  }
}
