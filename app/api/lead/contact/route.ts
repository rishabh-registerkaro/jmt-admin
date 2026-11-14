import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import prisma from "@/app/lib/config/db";
import { hasSharedSecret, identityOverLimit } from "@/app/lib/utils/leadThrottle";
import { sendLeadNotification } from "@/app/lib/config/email";
import {
  CONTACT_LEAD_SOURCE,
  EMPTY_CONTACT_VALUES,
  HONEYPOT_FIELD,
  readContactValues,
  validateContact,
  type ContactFormState,
} from "@/utils/contactForm";

// POST /api/lead/contact — the Joy Maa Tara Contact page "Send an enquiry" form.
//
// Called server-to-server by the jmt-frontend Server Action
// (jmt-frontend/app/actions/contactLead.ts) with the form as multipart/form-data.
// Always answers with a ContactFormState JSON body.
//
// Same storage and safeguards as /api/lead/homepage: one row in `leads`
// (name and phone in columns, the rest in `formData`), an email to the admin,
// and a per-visitor rate limit. This form has no email field, so the email
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

function successState(): ContactFormState {
  return {
    status: "success",
    message: "Thanks — your enquiry is in. Our team will call you back within 2 working hours.",
    fieldErrors: {},
    values: EMPTY_CONTACT_VALUES,
  };
}

const reply = (state: ContactFormState, status = 200) => NextResponse.json(state, { status });

export async function POST(req: NextRequest) {
  // Only jmt-frontend's server may post here; it proves itself with the shared secret.
  if (!hasSharedSecret(req)) {
    return reply(
      {
        status: "error",
        message: "We couldn't send your enquiry just now. Please try again, or call or WhatsApp us directly.",
        fieldErrors: {},
        values: EMPTY_CONTACT_VALUES,
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
        message: "We couldn't read your enquiry. Please try again.",
        fieldErrors: {},
        values: EMPTY_CONTACT_VALUES,
      },
      400,
    );
  }

  // Bots fill every field; pretend success so they don't retry.
  const honeypot = formData.get(HONEYPOT_FIELD);
  if (typeof honeypot === "string" && honeypot.trim() !== "") {
    return reply(successState());
  }

  const values = readContactValues(formData);
  const fieldErrors = validateContact(values);
  if (Object.keys(fieldErrors).length > 0) {
    return reply(
      { status: "error", message: "Please check the highlighted fields.", fieldErrors, values },
      400,
    );
  }

  // In-memory per IP (one instance) + per phone in MySQL (all instances).
  if (isRateLimited(clientIp(req)) || (await identityOverLimit("", values.phone).catch(() => false))) {
    return reply(
      {
        status: "error",
        message:
          "You've sent several enquiries in a short time. Please wait a few minutes, or call or WhatsApp us directly.",
        fieldErrors: {},
        values,
      },
      429,
    );
  }

  const details: Record<string, string> = {
    Service: values.service,
    "Company name": values.companyName,
    "Site location": values.siteLocation,
    "Crew size": values.headcount,
    "Start date": values.startDate,
    Note: values.note,
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
        leadSource: CONTACT_LEAD_SOURCE,
        formData: leadFormData,
        status: "new",
      },
    });

    // Wait briefly so serverless hosts don't cut the email off, but never let
    // a slow mail server delay the visitor.
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
    console.error("[contact] Failed to save lead:", error);
    return reply(
      {
        status: "error",
        message: "We couldn't send your enquiry just now. Please try again, or call or WhatsApp us directly.",
        fieldErrors: {},
        values,
      },
      500,
    );
  }
}
