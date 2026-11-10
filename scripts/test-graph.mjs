/**
 * Microsoft Graph Mail.Send check — validates GRAPH_* wiring before any code
 * in app/lib/config/email.ts is changed.
 *
 * Usage:
 *   node scripts/test-graph.mjs                    # token only, sends nothing
 *   node scripts/test-graph.mjs you@gmail.com      # token + send a real test mail
 *
 * Read-only with respect to the app: this touches no application code and no
 * SMTP configuration. Production continues on Gmail SMTP until Graph is proven.
 *
 * Send the test to an EXTERNAL inbox (Gmail), not another mailbox on the same
 * domain — internal delivery skips the SPF/DKIM checks that matter in production.
 */
import "dotenv/config";

const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// dotenv only treats `#` as a comment. A trailing `// note` and any wrapping
// quotes end up inside the value, which silently breaks the token request.
const clean = (v) =>
  (v ?? "")
    .replace(/\s+\/\/.*$/, "")   // strip a trailing // comment
    .trim()
    .replace(/^["']|["']$/g, "") // strip wrapping quotes
    .trim();

const tenant = clean(process.env.GRAPH_TENANT_ID);
const clientId = clean(process.env.GRAPH_CLIENT_ID);
const sender = clean(process.env.GRAPH_SENDER);
const to = process.argv[2];

// Entra shows two things on a client secret: "Secret ID" (a GUID, never used)
// and "Value" (the actual secret). Pasting the Secret ID is a common mistake
// and produces an opaque AADSTS7000215, so resolve it explicitly here.
const rawSecret = clean(process.env.GRAPH_CLIENT_SECRET);
const rawValue = clean(process.env.GRAPH_CLIENT_VALUE);

let secret = rawSecret;
let secretSource = "GRAPH_CLIENT_SECRET";
const notes = [];

if (rawSecret && GUID.test(rawSecret)) {
  notes.push(
    "GRAPH_CLIENT_SECRET is a GUID — that is the Secret *ID* from Entra, not the secret.\n" +
    "    Entra shows two columns when you create a client secret:\n" +
    "      Value     <- this is the secret. Shown once, never again.\n" +
    "      Secret ID <- a GUID. Never used for authentication.\n" +
    "    Put the Value into GRAPH_CLIENT_SECRET."
  );
  if (rawValue && !GUID.test(rawValue)) {
    secret = rawValue;
    secretSource = "GRAPH_CLIENT_VALUE (fallback)";
    notes.push("Falling back to GRAPH_CLIENT_VALUE, which has the right shape, so this run can proceed.");
  }
}
if (process.env.GRAPH_CLIENT_VALUE && /\/\//.test(process.env.GRAPH_CLIENT_VALUE)) {
  notes.push(
    'GRAPH_CLIENT_VALUE contains "//". dotenv does not treat // as a comment, so the\n' +
    "    trailing text becomes part of the value. Use # for comments in .env, or drop it."
  );
}

const missing = Object.entries({ GRAPH_TENANT_ID: tenant, GRAPH_CLIENT_ID: clientId, GRAPH_SENDER: sender })
  .filter(([, v]) => !v)
  .map(([k]) => k);
if (!secret) missing.push("GRAPH_CLIENT_SECRET");
if (missing.length) {
  console.error(`✗ Missing in .env: ${missing.join(", ")}`);
  process.exit(1);
}

console.log("Resolved config");
console.log(`  tenant   ${tenant}`);
console.log(`  client   ${clientId}`);
console.log(`  secret   ${secret.length} chars, from ${secretSource}`);
console.log(`  sender   ${sender}`);
console.log("");

if (notes.length) {
  for (const n of notes) console.warn(`  ! ${n}`);
  console.log("");
}

// --- Step 1: acquire an app-only token ------------------------------------

let token;
try {
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: secret,
    scope: "https://graph.microsoft.com/.default",
    grant_type: "client_credentials",
  });

  const res = await fetch(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const json = await res.json();

  if (!res.ok) {
    console.error("✗ Token request failed\n");
    console.error(`  ${json.error}: ${(json.error_description || "").split("\n")[0]}`);

    const d = json.error_description || "";
    if (d.includes("AADSTS7000215")) {
      console.error(`
  Invalid client secret. Almost always one of:
    - the Secret ID (a GUID) was pasted instead of the Value
    - the secret has expired — check Entra > App registrations >
      ${clientId} > Certificates & secrets
    - stray quotes or a trailing comment in .env`);
    } else if (d.includes("AADSTS700016") || d.includes("was not found in the directory")) {
      console.error(`
  GRAPH_CLIENT_ID is not an app in this tenant. Check both the client id and
  that GRAPH_TENANT_ID points at the client's tenant, not your own.`);
    } else if (d.includes("AADSTS90002")) {
      console.error(`
  GRAPH_TENANT_ID does not exist. Copy the Directory (tenant) ID from the
  app registration Overview page.`);
    }
    process.exit(1);
  }

  token = json.access_token;
  console.log("✓ Token acquired");
  console.log(`  expires in ${Math.round((json.expires_in ?? 0) / 60)} min`);

  // Roles land in the token only after admin consent — this is the cheapest
  // way to know whether consent has actually gone through.
  const claims = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
  const roles = claims.roles || [];
  if (roles.includes("Mail.Send")) {
    console.log("  roles      Mail.Send ✓ (admin consent granted)");
  } else {
    console.log(`  roles      ${roles.length ? roles.join(", ") : "(none)"}`);
    console.log(`
  ! Mail.Send is not in the token. Admin consent has not been granted yet, so
    the send below will fail with 403. The client's Global Admin must open
    Entra > App registrations > API permissions and click
    "Grant admin consent for <organisation>".`);
  }
} catch (err) {
  console.error(`✗ Could not reach login.microsoftonline.com: ${err.message}`);
  process.exit(1);
}

// --- Step 2: optional live send -------------------------------------------

if (!to) {
  console.log("\nNo recipient given — nothing sent.");
  console.log("Re-run as: node scripts/test-graph.mjs you@gmail.com");
  process.exit(0);
}

const message = {
  message: {
    subject: `JMT CMS — Graph test ${process.env.GRAPH_TEST_TAG || Math.floor(Date.now()/1000)}`,
    body: {
      contentType: "HTML",
      content:
        `<p>Sent via Microsoft Graph as <strong>${sender}</strong>.</p>` +
        `<p>Open &ldquo;Show original&rdquo; in Gmail and confirm SPF, DKIM and DMARC all say PASS.</p>`,
    },
    toRecipients: [{ emailAddress: { address: to } }],
  },
  // Save a copy so delivery can be traced: if it appears in the sender's Sent
  // Items, Exchange accepted and processed it and the problem is downstream.
  // If it never appears, it did not get past Graph.
  saveToSentItems: true,
};

const res = await fetch(
  `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(sender)}/sendMail`,
  {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(message),
  }
);

// Graph returns 202 Accepted with an empty body — there is no messageId.
if (res.status === 202) {
  console.log(`\n✓ Accepted by Graph (202) — queued to ${to}`);
  console.log(`
Auth passing is only half the test. Open the mail in Gmail, choose
"Show original", and confirm SPF, DKIM and DMARC each report PASS.
Delivered but failing DMARC means spam in production.`);
  process.exit(0);
}

const text = await res.text();
console.error(`\n✗ Send failed — HTTP ${res.status}`);
console.error(`  ${text.slice(0, 400)}`);

if (res.status === 403) {
  console.error(`
  Admin consent for Mail.Send has not been granted, or is still propagating.
  The client's Global Admin must open Entra > App registrations >
  ${clientId} > API permissions and click "Grant admin consent".
  Already clicked? Give it a few minutes and retry.

  A 403 can also mean an ApplicationAccessPolicy restricts this app to
  mailboxes that do not include ${sender}.`);
} else if (res.status === 404) {
  console.error(`
  ${sender} is not a mailbox in this tenant. It must be the primary address of
  a licensed mailbox — an alias or a shared mailbox without a licence will 404.`);
} else if (res.status === 401) {
  console.error(`
  Token rejected. Usually a tenant mismatch: GRAPH_TENANT_ID must be the
  client's tenant, the same one the app registration lives in.`);
} else if (res.status === 429) {
  console.error("\n  Throttled by Graph. Wait and retry.");
}
process.exit(1);
