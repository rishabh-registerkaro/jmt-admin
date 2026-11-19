import * as ftp from "basic-ftp";
import { randomBytes } from "crypto";
import { isIP } from "net";
import { Readable, Writable } from "stream";
import { checkServerIdentity, type ConnectionOptions } from "tls";

// Hostinger file storage over FTP, shared by the Media library
// (app/api/media/route.ts → public folder HOSTINGER_MEDIA_PATH) and the Join
// our crew documents (app/api/lead/join/route.ts → private folder
// HOSTINGER_APPLICATIONS_PATH, outside public_html, read back only through
// the logged-in /api/applications/[id]/documents route).

/** Public media folder (served by the web server at HOSTINGER_MEDIA_URL). */
export const mediaFolder = () => process.env.HOSTINGER_MEDIA_PATH || "/public_html/media";

/** Private folder for applicants' CVs and letters — must NOT be inside public_html. */
export const applicationsFolder = () => process.env.HOSTINGER_APPLICATIONS_PATH || "/applications";

/**
 * Safe stored name: timestamp + the original base name (no dots, no path) +
 * the extension fixed by the file's checked type — never the uploaded one, so
 * "shell.php" sent as a PDF can't become executable on the web server.
 */
export function buildStoredFilename(originalName: string, extension: string): string {
  const base =
    originalName
      .replace(/\.[^.]*$/, "")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 120) || "file";
  // Random part: files sent together share a millisecond and may share a name.
  return `${Date.now()}_${randomBytes(4).toString("hex")}_${base}.${extension}`;
}

/** True when the file's first bytes match what its declared MIME type must start with. */
export function matchesMagicBytes(buffer: Buffer, mimeType: string): boolean {
  const startsWith = (bytes: number[], offset = 0) =>
    buffer.length >= offset + bytes.length && bytes.every((b, i) => buffer[offset + i] === b);
  switch (mimeType) {
    case "image/jpeg":
      return startsWith([0xff, 0xd8, 0xff]);
    case "image/png":
      return startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case "image/gif":
      return startsWith([0x47, 0x49, 0x46, 0x38]); // "GIF8"
    case "image/webp":
      return startsWith([0x52, 0x49, 0x46, 0x46]) && startsWith([0x57, 0x45, 0x42, 0x50], 8); // "RIFF"…"WEBP"
    case "application/pdf":
      // "%PDF-" — readers tolerate a little junk before the header
      return buffer.subarray(0, 1024).includes("%PDF-");
    case "application/msword":
      return startsWith([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]); // OLE compound file
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return startsWith([0x50, 0x4b, 0x03, 0x04]); // "PK" zip
    default:
      return true; // svg is checked as text; no cheap signature check for video
  }
}

/**
 * Name the FTP server's certificate must be valid for. Hostinger's FTP
 * servers present a Let's Encrypt certificate for "*.hstgr.io", not for the
 * server's IP address or your own domain. So when HOSTINGER_FTP_HOST is a bare
 * IP (as hPanel shows it), the certificate is checked against this name
 * instead: the connection is still fully verified (trusted CA, not expired,
 * issued to Hostinger), it just isn't expected to name the IP.
 * Override with HOSTINGER_FTP_TLS_HOSTNAME if a host uses another certificate.
 */
const DEFAULT_TLS_HOSTNAME = "hstgr.io";

function tlsOptionsFor(host: string): ConnectionOptions {
  if (process.env.HOSTINGER_FTP_TLS_INSECURE?.trim().toLowerCase() === "true") {
    // Last resort: still encrypted, but the server is not verified at all.
    return { host, rejectUnauthorized: false };
  }
  if (!isIP(host)) return { host }; // a host name: normal verification
  const expected = process.env.HOSTINGER_FTP_TLS_HOSTNAME?.trim() || DEFAULT_TLS_HOSTNAME;
  // basic-ftp keeps these options for the data connections too, so every
  // upload/download socket gets the same check.
  return { host, servername: expected, checkServerIdentity: (_ip, cert) => checkServerIdentity(expected, cert) };
}

// FTPS (explicit TLS) unless HOSTINGER_FTP_SECURE=false. There is no fallback
// to plain FTP: if the server refuses TLS the upload fails.
async function connectToHostinger(client: ftp.Client): Promise<void> {
  const host = process.env.HOSTINGER_FTP_HOST!.trim();
  const secure = (process.env.HOSTINGER_FTP_SECURE ?? "true").trim().toLowerCase() !== "false";

  // Same steps as client.access(), split up so a TLS failure can be told
  // apart from a wrong password.
  await client.connect(host, Number(process.env.HOSTINGER_FTP_PORT) || 21);
  if (secure) {
    try {
      await client.useTLS(tlsOptionsFor(host));
    } catch (error) {
      console.error(
        "Hostinger FTP: could not start TLS (AUTH TLS / handshake failed). " +
          "Uploads use FTPS because HOSTINGER_FTP_SECURE is not \"false\"; plain FTP is never used as a fallback. " +
          "If HOSTINGER_FTP_HOST is an IP address, its certificate is checked against HOSTINGER_FTP_TLS_HOSTNAME " +
          `(default "${DEFAULT_TLS_HOSTNAME}"); set that to a name the server's certificate covers. ` +
          "If the server has no TLS support at all, set HOSTINGER_FTP_SECURE=false (credentials and files are then sent unencrypted).",
        error
      );
      throw error;
    }
  }
  await client.sendIgnoringError("OPTS UTF8 ON");
  await client.login(process.env.HOSTINGER_FTP_USER!, process.env.HOSTINGER_FTP_PASS!);
  await client.useDefaultSettings();
}

async function withClient<T>(run: (client: ftp.Client) => Promise<T>): Promise<T> {
  const client = new ftp.Client();
  try {
    await connectToHostinger(client);
    return await run(client);
  } finally {
    client.close();
  }
}

/** Uploads several files to one folder over a single connection. */
export async function uploadToFolder(folder: string, files: { buffer: Buffer; filename: string }[]): Promise<void> {
  await withClient(async (client) => {
    await client.ensureDir(folder);
    for (const file of files) await client.uploadFrom(Readable.from(file.buffer), file.filename);
  });
}

export async function downloadFromFolder(folder: string, filename: string): Promise<Buffer> {
  const chunks: Buffer[] = [];
  const sink = new Writable({
    write(chunk, _encoding, done) {
      chunks.push(Buffer.from(chunk));
      done();
    },
  });
  await withClient((client) => client.downloadTo(sink, `${folder}/${filename}`));
  return Buffer.concat(chunks);
}

/** Removes files from a folder; missing files are ignored. */
export async function removeFromFolder(folder: string, filenames: string[]): Promise<void> {
  if (filenames.length === 0) return;
  await withClient(async (client) => {
    for (const filename of filenames) await client.remove(`${folder}/${filename}`, true);
  });
}
