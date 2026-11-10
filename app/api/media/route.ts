import { NextRequest, NextResponse } from "next/server";
import { intParam } from "@/app/lib/utils/pagination";
import { requireRole } from "@/app/lib/utils/authorization";
import { CONTENT_ROLES } from "@/app/lib/constants/role";
import prisma from "@/app/lib/config/db";
import * as ftp from "basic-ftp";
import { Readable } from "stream";
import { revalidateFrontendTags } from "@/app/lib/utils/revalidateFrontend";

// The public homepage swaps in uploaded photos named "home-*" (e.g.
// home-hero.jpg — see server/homepage.ts). Expire its cached media lookup
// so an upload or delete shows immediately instead of after the 10-min ISR.
async function revalidateHomepageMedia(filename: string) {
  if (filename.toLowerCase().startsWith("home-")) {
    await revalidateFrontendTags(["homepage-media"]);
  }
}

const MAX_MEDIA_SIZE = 25 * 1024 * 1024; // 25MB
// Allowed MIME type → the only extension a file of that type is stored with.
// The extension is never taken from the uploaded name: the media folder is
// served by Hostinger's web server, so "shell.php" sent as image/png would
// otherwise be executable.
const ALLOWED_MEDIA_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "application/pdf": "pdf",
  "video/mp4": "mp4",
  "video/webm": "webm",
};

/** Safe base name (no extension, no dots) + the extension fixed by MIME type. */
function buildStoredFilename(originalName: string, mimeType: string): string {
  const base = originalName
    .replace(/\.[^.]*$/, "")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 120) || "file";
  return `${Date.now()}_${base}.${ALLOWED_MEDIA_TYPES[mimeType]}`;
}

async function uploadToHostinger(buffer: Buffer, filename: string): Promise<string> {
  const client = new ftp.Client();
  try {
    await client.access({
      host: process.env.HOSTINGER_FTP_HOST!,
      user: process.env.HOSTINGER_FTP_USER!,
      password: process.env.HOSTINGER_FTP_PASS!,
      port: Number(process.env.HOSTINGER_FTP_PORT) || 21,
      secure: false,
    });
    await client.ensureDir(process.env.HOSTINGER_MEDIA_PATH || "/public_html/media");
    await client.uploadFrom(Readable.from(buffer), filename);
    const baseUrl = (process.env.HOSTINGER_MEDIA_URL || "").replace(/\/$/, "");
    return `${baseUrl}/${filename}`;
  } finally {
    client.close();
  }
}

async function deleteFromHostinger(filename: string): Promise<void> {
  const client = new ftp.Client();
  try {
    await client.access({
      host: process.env.HOSTINGER_FTP_HOST!,
      user: process.env.HOSTINGER_FTP_USER!,
      password: process.env.HOSTINGER_FTP_PASS!,
      port: Number(process.env.HOSTINGER_FTP_PORT) || 21,
      secure: false,
    });
    const remotePath = `${process.env.HOSTINGER_MEDIA_PATH || "/public_html/media"}/${filename}`;
    await client.remove(remotePath);
  } finally {
    client.close();
  }
}

export async function POST(req: NextRequest) {
  try {
    const userResult = await requireRole(req, CONTENT_ROLES);
    if (userResult instanceof NextResponse) return userResult;
    if (!userResult.id) {
      return NextResponse.json({ message: "Unauthorized. Please login." }, { status: 401 });
    }

    const form = await req.formData();
    const file = form.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (file.size > MAX_MEDIA_SIZE) {
      return NextResponse.json({ error: "File too large (max 25MB)" }, { status: 400 });
    }
    if (!Object.hasOwn(ALLOWED_MEDIA_TYPES, file.type)) {
      return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
    }

    const safeFilename = buildStoredFilename(file.name, file.type);
    const buffer = Buffer.from(await file.arrayBuffer());

    const url = await uploadToHostinger(buffer, safeFilename);
    const format = ALLOWED_MEDIA_TYPES[file.type];
    const resourceType = file.type.startsWith("image/") ? "image" : "raw";

    await prisma.mediaAsset.create({
      data: {
        key: safeFilename,
        filename: file.name,
        format,
        resourceType,
        bytes: file.size,
        url,
      },
    });
    await revalidateHomepageMedia(file.name);

    return NextResponse.json(
      { url, publicId: safeFilename, resource_type: resourceType },
      { status: 200 }
    );
  } catch (error) {
    console.error("Media upload error:", error);
    return NextResponse.json({ error: "Upload failed", details: String(error) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const userResult = await requireRole(req, CONTENT_ROLES);
    if (userResult instanceof NextResponse) return userResult;
    if (!userResult.id) {
      return NextResponse.json({ message: "Unauthorized. Please login." }, { status: 401 });
    }

    // Paginated chunks — no more hard cap hiding assets beyond the first 200
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, intParam(searchParams.get("page"), 1));
    const limit = Math.min(100, Math.max(1, intParam(searchParams.get("limit"), 24)));
    const skip = (page - 1) * limit;
    // Optional filters used by the image picker: ?type=image&search=hero
    const type = searchParams.get("type");
    const search = searchParams.get("search")?.trim().slice(0, 100);
    const where = {
      ...(type === "image" || type === "raw" ? { resourceType: type } : {}),
      ...(search ? { filename: { contains: search } } : {}),
    };

    const [total, docs] = await Promise.all([
      prisma.mediaAsset.count({ where }),
      prisma.mediaAsset.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    const resources = docs.map((doc) => ({
      asset_id: doc.id,
      public_id: doc.key,
      filename: doc.filename,
      format: doc.format,
      secure_url: doc.url,
      bytes: doc.bytes,
      width: 0,
      height: 0,
      created_at: doc.createdAt,
      resource_type: doc.resourceType,
    }));

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json(
      {
        message: "Fetched media",
        result: {
          resources,
          pagination: {
            currentPage: page,
            totalPages,
            totalCount: total,
            limit,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Media fetch error:", error);
    return NextResponse.json({ message: "Error fetching media", error: String(error) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userResult = await requireRole(req, CONTENT_ROLES);
    if (userResult instanceof NextResponse) return userResult;
    if (!userResult.id) {
      return NextResponse.json({ message: "Unauthorized. Please login." }, { status: 401 });
    }

    const body = await req.json();
    const public_id = body?.public_id;
    if (!public_id) {
      return NextResponse.json({ error: "public_id is missing" }, { status: 400 });
    }

    // Only delete files this CMS uploaded: the key must exist in media_assets.
    // Never pass the raw client value to FTP — "../index.php" would escape
    // the media folder.
    const asset = await prisma.mediaAsset.findUnique({ where: { key: String(public_id) } });
    if (!asset) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    try {
      await deleteFromHostinger(asset.key);
    } catch {
      // file may already be missing on Hostinger — still clean up DB record
    }

    await prisma.mediaAsset.delete({ where: { id: asset.id } });
    await revalidateHomepageMedia(asset.filename);

    return NextResponse.json({ result: { deleted: true } }, { status: 200 });
  } catch (error: any) {
    console.error("Media delete error:", error);
    return NextResponse.json({ error: error.message || "Delete failed" }, { status: 500 });
  }
}
