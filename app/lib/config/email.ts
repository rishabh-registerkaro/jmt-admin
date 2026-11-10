// All outbound mail goes through SMTP (Gmail) via nodemailer.
import nodemailer from "nodemailer";

const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASSWORD = process.env.SMTP_PASSWORD;
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER;

// requireTLS aborts if STARTTLS can't be negotiated (no plaintext fallback).
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  requireTLS: true,
  auth: { user: SMTP_USER!, pass: SMTP_PASSWORD! },
});

/** Send one HTML message from SMTP_FROM. Throws on failure. */
async function sendMail({
  to,
  cc,
  subject,
  html,
}: {
  to: string;
  cc?: string;
  subject: string;
  html: string;
}) {
  if (!SMTP_USER || !SMTP_PASSWORD) {
    throw new Error("SMTP_USER and SMTP_PASSWORD are required in environment variables");
  }
  return transporter.sendMail({ from: SMTP_FROM, to, cc, subject, html });
}

const escapeHtml = (s: unknown) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/**
 * Notify the admin (ADMIN_NOTIFY_EMAIL, cc NOTIFY_CC_EMAIL when set) that a
 * new lead was submitted through a website form. Never throws — a failed
 * email must not fail the lead submission.
 */
export async function sendLeadNotification(lead: {
  name: string;
  email: string;
  phoneNo: string;
  leadSource: string;
  formData?: Record<string, string> | null;
  createdAt?: Date;
}) {
  try {
    const adminEmail = process.env.ADMIN_NOTIFY_EMAIL;
    if (!adminEmail) {
      console.warn("ADMIN_NOTIFY_EMAIL not set — skipping lead notification");
      return;
    }
    const cc = process.env.NOTIFY_CC_EMAIL || undefined;

    // Label stacked ABOVE the value in a single full-width column — two-column
    // rows collapse badly on mobile mail clients (one character per line).
    const row = (label: string, value: string, link?: string) => `
      <tr>
        <td colspan="2" style="padding:12px 24px 0;font-size:11px;font-weight:700;color:#94a3b8;letter-spacing:0.08em;">${label}</td>
      </tr>
      <tr>
        <td colspan="2" style="padding:3px 24px 12px;font-size:14.5px;color:#f1f5f9;font-weight:600;line-height:1.5;word-break:break-word;">${
          link ? `<a href="${link}" style="color:#a5b4fc;text-decoration:none;">${value}</a>` : value
        }</td>
      </tr>`;

    const detailRows = Object.entries(lead.formData ?? {})
      .map(([label, value]) => row(escapeHtml(label).toUpperCase(), escapeHtml(value)))
      .join("");

    const when = (lead.createdAt ?? new Date()).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
      timeStyle: "short",
    });

    const html = `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background:#0f172a;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
          <tr>
            <td style="padding:0 4px 14px;font-size:13px;font-weight:700;color:#e2e8f0;">
              <span style="display:inline-block;width:8px;height:8px;background:#22c55e;border-radius:50%;margin-right:8px;"></span>JMT CMS
            </td>
          </tr>
          <tr>
            <td style="background:#1e293b;border:1px solid #334155;border-radius:14px;overflow:hidden;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:22px 24px;border-bottom:1px solid #334155;">
                    <div style="font-size:12px;font-weight:700;letter-spacing:0.1em;color:#818cf8;">NEW LEAD RECEIVED</div>
                    <div style="font-size:20px;font-weight:800;color:#f8fafc;margin-top:6px;">${escapeHtml(lead.name)}</div>
                    <div style="font-size:13px;color:#94a3b8;margin-top:4px;">${escapeHtml(lead.leadSource)} • ${escapeHtml(when)} IST</div>
                  </td>
                </tr>
                ${row("EMAIL", escapeHtml(lead.email), `mailto:${escapeHtml(lead.email)}`)}
                ${row("PHONE", escapeHtml(lead.phoneNo), `tel:${escapeHtml(lead.phoneNo.replace(/[^\d+]/g, ""))}`)}
                ${row("SUBMITTED FROM", escapeHtml(lead.leadSource))}
                ${
                  detailRows
                    ? `<tr><td colspan="2" style="padding:16px 24px 0;font-size:11px;font-weight:800;letter-spacing:0.12em;color:#818cf8;border-top:1px solid #334155;">FORM DETAILS</td></tr>${detailRows}`
                    : ""
                }
                <tr>
                  <td colspan="2" style="padding:16px 24px 20px;border-top:1px solid #334155;">
                    <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">Open your CMS dashboard → <strong style="color:#cbd5e1;">Leads</strong> to view, contact or update this lead.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 4px 0;">
              <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#cbd5e1;letter-spacing:0.02em;">JMT TECHNOLOGIES (OPC) PRIVATE LIMITED</p>
              <p style="margin:0;font-size:11.5px;color:#64748b;line-height:1.6;">You're receiving this because you're listed as an admin contact for JMT CMS.</p>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

    await sendMail({
      to: adminEmail,
      cc,
      subject: `New lead: ${lead.name} — ${lead.leadSource}`,
      html,
    });
  } catch (error) {
    console.error("Failed to send lead notification email:", error);
  }
}

export async function sendOTP(email: string, otp: string) {
    try {
        if (!SMTP_USER || !SMTP_PASSWORD) {
            throw new Error("SMTP_USER and SMTP_PASSWORD are required in environment variables");
        }

        // Defensive escaping for anything interpolated into HTML
        const esc = (s: string) =>
            String(s)
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#39;");

        const safeOtp = esc(otp);
        const safeEmail = esc(email);

        const mailOptions = {
            to: email,
            subject: "Your JMT CMS password reset code",
            html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="color-scheme" content="dark light">
    <meta name="supported-color-schemes" content="dark light">
    <title>Password Reset Code</title>
</head>
<body style="margin:0;padding:0;background:#0b1220;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;color:#f1f5f9;">

    <!-- Preheader (inbox preview line) -->
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;font-size:1px;line-height:1px;">
        Your JMT CMS verification code is ${safeOtp}. It expires in 10 minutes.
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0b1220;padding:40px 16px;">
        <tr>
            <td align="center">
                <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;">

                    <!-- Brand strip -->
                    <tr>
                        <td style="padding:0 6px 18px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td style="font-size:13px;font-weight:700;color:#cbd5e1;letter-spacing:0.02em;">
                                        <span style="display:inline-block;width:8px;height:8px;background:#22c55e;border-radius:50%;margin-right:8px;"></span>JMT CMS
                                    </td>
                                    <td align="right" style="font-size:11px;color:#64748b;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;">Security</td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Card -->
                    <tr>
                        <td style="background:#111c30;border-radius:14px;overflow:hidden;border:1px solid #1f2a44;">

                            <!-- Gradient accent -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr><td style="background:linear-gradient(135deg,#3b82f6 0%,#6366f1 50%,#8b5cf6 100%);height:4px;line-height:0;font-size:0;">&nbsp;</td></tr>
                            </table>

                            <!-- Header -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td style="padding:32px 36px 4px;">
                                        <p style="margin:0 0 10px;font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#818cf8;">Password reset</p>
                                        <h1 style="margin:0;font-size:24px;line-height:1.3;font-weight:700;color:#f8fafc;">Verify your identity</h1>
                                        <p style="margin:12px 0 0;font-size:14px;color:#94a3b8;line-height:1.6;">We received a request to reset the password for your JMT CMS account. Use the one-time code below to continue. If this wasn't you, you can safely ignore this email.</p>
                                    </td>
                                </tr>
                            </table>

                            <!-- OTP Display -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td style="padding:24px 36px 8px;">
                                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0b1220;border:1px solid #1f2a44;border-radius:10px;">
                                            <tr>
                                                <td style="padding:28px 24px;text-align:center;">
                                                    <p style="margin:0 0 14px;font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#64748b;">Verification code</p>
                                                    <p style="margin:0;font-size:38px;font-weight:700;color:#a5b4fc;letter-spacing:10px;font-family:'SF Mono','Menlo','Courier New',Consolas,monospace;line-height:1.1;">${safeOtp}</p>
                                                    <p style="margin:16px 0 0;font-size:12px;color:#64748b;">Expires in 10 minutes</p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <!-- Security note -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td style="padding:16px 36px 8px;">
                                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.22);border-radius:8px;">
                                            <tr>
                                                <td style="padding:14px 16px;">
                                                    <p style="margin:0;font-size:13px;color:#fcd34d;line-height:1.55;">
                                                        <strong style="color:#fde68a;">Don't share this code.</strong> <span style="color:#fbbf24;">JMT staff will never ask for your verification code. If you didn't request a reset, your password will remain unchanged.</span>
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <!-- Sent to -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td style="padding:20px 36px 32px;">
                                        <p style="margin:0;padding:16px 0 0;border-top:1px solid #1f2a44;font-size:12px;color:#64748b;line-height:1.5;">
                                            This code was sent to <span style="color:#cbd5e1;font-weight:600;">${safeEmail}</span>
                                        </p>
                                    </td>
                                </tr>
                            </table>

                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding:24px 6px 0;text-align:center;">
                            <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#cbd5e1;letter-spacing:0.02em;">JMT TECHNOLOGIES (OPC) PRIVATE LIMITED</p>
                            <p style="margin:0;font-size:11px;color:#64748b;line-height:1.6;">
                                Automated security message · Please do not reply to this email
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>`,
        };

        const info = await sendMail(mailOptions);
        console.log("OTP email sent to:", email, info.messageId);
        return info;
    } catch (error: any) {
        console.error("SMTP send error:", {
            message: error.message,
            code: error.code,
            command: error.command,
            response: error.response,
            stack: error.stack,
        });
        throw error;
    }
}