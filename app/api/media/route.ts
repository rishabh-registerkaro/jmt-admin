import { NextRequest, NextResponse } from "next/server";
import { intParam } from "@/app/lib/utils/pagination";
import { requirePermission } from "@/app/lib/utils/authorization";
import { CONTENT_PERMISSIONS, PERMISSIONS } from "@/app/lib/constants/permissions";
import prisma from "@/app/lib/config/db";
import {
  buildStoredFilename,
  matchesMagicBytes,
  mediaFolder,
  removeFromFolder,
  uploadToFolder,
} from "@/app/lib/utils/hostingerFtp";
import { revalidateFrontendTags } from "@/app/lib/utils/revalidateFrontend";

// The public homepage swaps in uploaded photos named "home-*" (e.g.
// home-hero.jpg — see server/homepage.ts). Expire its cached media lookup
// so an upload or delete shows immediately instead of after the 10-min ISR.
async function revalidateHomepageMedia(filename: string) {
  if (filename.toLowerCase().startsWith("home-")) {
    await revalidateFrontendTags(["homepage-media"]);
  }
}

// 25MB, except on Vercel, which rejects request bodies over 4.5MB itself.
const MAX_MEDIA_SIZE = process.env.VERCEL ? 4 * 1024 * 1024 : 25 * 1024 * 1024;
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

const IS_DEV = process.env.NODE_ENV === "development";

/**
 * An SVG is a document, not just a picture: opened directly from the media
 * folder it can run script on that domain. Returns why the file is unsafe,
 * or null when nothing active was found.
 */
function findUnsafeSvgContent(buffer: Buffer): string | null {
  // UTF-16/32 text would slip past the plain-text checks below
  if (buffer.includes(0)) return "it is not UTF-8 text";
  const text = buffer.toString("utf8");
  if (!/<svg[\s>]/i.test(text)) return "it is not an SVG document";
  if (/<!DOCTYPE/i.test(text) || /<!ENTITY/i.test(text)) return "it contains a DOCTYPE or entity declaration";
  // The namespace prefix is matched loosely: XML allows "." and non-ASCII
  // letters in it (<a.b:script>), not just [\w-]
  if (/<\s*(?:[^\s<>/:="']+:)?script/i.test(text)) return "it contains a <script> element";
  if (/<\s*(?:[^\s<>/:="']+:)?(?:foreignObject|iframe|embed|object)[\s/>]/i.test(text)) {
    return "it contains a <foreignObject>, <iframe>, <embed> or <object> element";
  }
  if (/[\s"'/]on[a-z]+\s*=/i.test(text)) return "it contains an on* event-handler attribute";
  // "javascript:" can be hidden with character references or whitespace
  const decoded = text
    .replace(/&#x([0-9a-f]+);?/gi, (_, hex) => String.fromCodePoint(Math.min(parseInt(hex, 16), 0x10ffff)))
    .replace(/&#(\d+);?/g, (_, dec) => String.fromCodePoint(Math.min(parseInt(dec, 10), 0x10ffff)))
    .replace(/&colon;/gi, ":")
    .replace(/&(?:Tab|NewLine);/g, "")
    .replace(/[\s\u0000-\u001f]+/g, "");
  if (/javascript:/i.test(decoded)) return "it contains a javascript: URL";
  return null;
}

async function uploadToHostinger(buffer: Buffer, filename: string): Promise<string> {
  await uploadToFolder(mediaFolder(), [{ buffer, filename }]);
  const baseUrl = (process.env.HOSTINGER_MEDIA_URL || "").replace(/\/$/, "");
  return `${baseUrl}/${filename}`;
}

export async function POST(req: NextRequest) {
  try {
    const userResult = await requirePermission(req, CONTENT_PERMISSIONS);
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
      return NextResponse.json({ error: `File too large (max ${MAX_MEDIA_SIZE / 1024 / 1024}MB)` }, { status: 400 });
    }
    if (!Object.hasOwn(ALLOWED_MEDIA_TYPES, file.type)) {
      return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
    }

    const safeFilename = buildStoredFilename(file.name, ALLOWED_MEDIA_TYPES[file.type]);
    const buffer = Buffer.from(await file.arrayBuffer());

    if (file.type === "image/svg+xml") {
      const unsafe = findUnsafeSvgContent(buffer);
      if (unsafe) {
        return NextResponse.json(
          { error: `SVG rejected: ${unsafe}. Remove it (or export a plain SVG / PNG) and upload again.` },
          { status: 400 }
        );
      }
    } else if (!matchesMagicBytes(buffer, file.type)) {
      return NextResponse.json({ error: "File content does not match its file type" }, { status: 400 });
    }

    const url = await uploadToHostinger(buffer, safeFilename);
    const format = ALLOWED_MEDIA_TYPES[file.type];
    const resourceType = file.type.startsWith("image/") ? "image" : "raw";

    await prisma.mediaAsset.create({
      data: {
        key: safeFilename,
        filename: file.name.slice(0, 191), // media_assets.filename is VARCHAR(191)
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
    return NextResponse.json({ error: "Upload failed", ...(IS_DEV ? { details: String(error) } : {}) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const userResult = await requirePermission(req, CONTENT_PERMISSIONS);
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
    return NextResponse.json({ message: "Error fetching media", ...(IS_DEV ? { error: String(error) } : {}) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userResult = await requirePermission(req, PERMISSIONS.MEDIA_MANAGE);
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
      await removeFromFolder(mediaFolder(), [asset.key]);
    } catch {
      // file may already be missing on Hostinger — still clean up DB record
    }

    await prisma.mediaAsset.delete({ where: { id: asset.id } });
    await revalidateHomepageMedia(asset.filename);

    return NextResponse.json({ result: { deleted: true } }, { status: 200 });
  } catch (error) {
    console.error("Media delete error:", error);
    return NextResponse.json(
      { error: "Delete failed", ...(IS_DEV ? { details: String(error) } : {}) },
      { status: 500 }
    );
  }
}
