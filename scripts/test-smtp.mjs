/**
 * SMTP credential check — validates SMTP_* wiring before deploying it.
 *
 * Usage:
 *   node scripts/test-smtp.mjs                    # auth only, sends nothing
 *   node scripts/test-smtp.mjs you@gmail.com      # auth + send a real test mail
 *
 * Reads the same variables as app/lib/config/email.ts, so a pass here means the
 * OTP and lead-notification mail will authenticate too.
 *
 * Send the test to an EXTERNAL inbox (Gmail), not another mailbox on the same
 * domain — internal delivery skips the SPF/DKIM checks that matter in production.
 */
import "dotenv/config";
import nodemailer from "nodemailer";

const host = process.env.SMTP_HOST || "smtp.gmail.com";
const port = parseInt(process.env.SMTP_PORT || "587");
const secure = process.env.SMTP_SECURE === "true";
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASSWORD;
const from = process.env.SMTP_FROM;
const to = process.argv[2];

if (!user || !pass) {
  console.error("✗ SMTP_USER and SMTP_PASSWORD must be set in .env");
  process.exit(1);
}

console.log("Resolved config");
console.log(`  host    ${host}:${port} ${secure ? "(SSL)" : "(STARTTLS)"}`);
console.log(`  user    ${user}`);
console.log(`  pass    ${pass.length} chars, ${/\s/.test(pass) ? "CONTAINS SPACES" : "no spaces"}`);
console.log(`  from    ${from || "(unset)"}`);
console.log("");

// --- Pre-flight: the mistakes that actually happen -------------------------

let warned = false;
const check = (cond, msg) => { if (cond) { console.warn(`  ! ${msg}`); warned = true; } };

const isMicrosoft = /office365|outlook/.test(host);
const fromAddr = from?.match(/<([^>]+)>/)?.[1] || from;

check(/\s/.test(pass), "App password still has spaces — Microsoft shows it grouped; paste it unspaced.");
check(isMicrosoft && pass.length !== 16, `App passwords are 16 chars; yours is ${pass.length}. An account login password will be rejected.`);
check(secure && port === 587, "SMTP_SECURE=true on port 587 will hang with no error. Use false for 587.");
check(!secure && port === 465, "Port 465 requires SMTP_SECURE=true.");
check(isMicrosoft && port !== 587, "Microsoft expects port 587 for client submission.");
check(!from, "SMTP_FROM is unset — Microsoft rejects mail with no From.");
check(
  isMicrosoft && fromAddr && user && fromAddr.toLowerCase() !== user.toLowerCase(),
  `From (${fromAddr}) differs from the authenticated mailbox (${user}). Microsoft rejects this with 5.7.60 — Gmail allowed it, Outlook will not.`
);
if (warned) console.log("");

// --- Authenticate ----------------------------------------------------------

const transporter = nodemailer.createTransport({ host, port, secure, auth: { user, pass } });

try {
  await transporter.verify();
  console.log("✓ Authenticated");
} catch (err) {
  console.error("✗ Authentication failed\n");
  console.error(`  ${err.message}`);
  const r = `${err.response || ""} ${err.message || ""}`;

  if (/SmtpClientAuthentication is disabled/i.test(r) || r.includes("5.7.57")) {
    const scope = /for the Tenant/i.test(r) ? "the whole tenant" : "this mailbox";
    console.error(`
  SMTP AUTH is switched off for ${scope}. This is a setting, not a permanent
  block — an admin can turn it on. Note it reports as 5.7.139 but is NOT the
  basic-auth retirement.

  Least-privilege fix, enables one mailbox only:
    Set-CASMailbox -Identity ${user} -SmtpClientAuthenticationDisabled $false

  Or in the admin center: Users > ${user} > Mail > Manage email apps >
  tick "Authenticated SMTP".

  Allow up to an hour to propagate before retrying.`);
  } else if (/basic authentication is disabled/i.test(r)) {
    console.error(`
  Microsoft has retired basic auth on this tenant. App passwords cannot work
  here and regenerating will not help — use OAuth2 or a transactional provider.`);
  } else if (r.includes("535")) {
    console.error(`
  Credentials rejected. Usual causes: account password used instead of an app
  password; spaces left in the app password; or SMTP_USER is an alias rather
  than the mailbox's primary address.`);
  } else if (err.code === "ETIMEDOUT" || err.code === "ECONNREFUSED") {
    console.error(`
  Could not reach ${host}:${port}. Check the hostname, and whether outbound
  SMTP is blocked on this network.`);
  }
  process.exit(1);
}

// --- Optional live send ----------------------------------------------------

if (!to) {
  console.log("\nNo recipient given — nothing sent.");
  console.log("Re-run as: node scripts/test-smtp.mjs you@gmail.com");
  process.exit(0);
}

try {
  const info = await transporter.sendMail({
    from,
    to,
    subject: "JMT CMS — SMTP test",
    text: `Sent via ${host}:${port} as ${user}.\n\nIn Gmail, open "Show original" and confirm SPF, DKIM and DMARC all say PASS.`,
  });
  console.log(`✓ Sent to ${to}`);
  console.log(`  message id ${info.messageId}`);
  if (info.rejected?.length) console.log(`  rejected   ${info.rejected.join(", ")}`);
  console.log(`
Auth passing is only half the test. Open the mail in Gmail, choose
"Show original", and confirm SPF, DKIM and DMARC each report PASS.
Delivered but failing DMARC means spam in production.`);
} catch (err) {
  console.error(`✗ Send failed: ${err.message}`);
  if (`${err.response}`.includes("5.7.60")) {
    console.error(`
  This mailbox may not send as ${fromAddr}. Set SMTP_FROM to use ${user},
  or have an admin grant SendAs on that address.`);
  }
  process.exit(1);
}
