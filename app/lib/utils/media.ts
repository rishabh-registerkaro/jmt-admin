/**
 * Largest upload the host accepts. Vercel rejects function request bodies over
 * 4.5 MB before our code runs (HTTP 413, non-JSON), so stay under it there;
 * elsewhere the API's own 25 MB cap applies. NEXT_PUBLIC_VERCEL_ENV is set
 * automatically by Vercel builds (build-time value).
 */
export const MAX_UPLOAD_BYTES = process.env.NEXT_PUBLIC_VERCEL_ENV ? 4 * 1024 * 1024 : 25 * 1024 * 1024;

function assertUploadSize(file: File) {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(`File too large (max ${Math.floor(MAX_UPLOAD_BYTES / 1024 / 1024)}MB). Compress or resize it and try again.`);
  }
}

/** Parses the API reply; a platform 413/HTML error page becomes a readable message. */
async function readUploadResponse(res: Response): Promise<Record<string, unknown>> {
  const data = await res.json().catch(() => ({}));
  if (res.status === 413) throw new Error(`File too large (max ${Math.floor(MAX_UPLOAD_BYTES / 1024 / 1024)}MB).`);
  return data as Record<string, unknown>;
}

export async function uploadFileToMedia(file: File): Promise<{ url: string; publicId: string; resource_type: string }> {
  assertUploadSize(file);
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/media", {
    method: "POST",
    body: formData,
  });

  const data = (await readUploadResponse(response)) as {
    url: string; publicId: string; resource_type: string; error?: string; message?: string;
  };
  if (!response.ok) {
    throw new Error(data.error || data.message || "Upload failed");
  }
  return {
    url: data.url,
    publicId: data.publicId,
    resource_type: data.resource_type,
  };
}
export async function uploadMediaAsset(file: File) {
  assertUploadSize(file);
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/media", {
    method: "POST",
    body: formData,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- callers read assorted fields (unchanged contract)
  const data = (await readUploadResponse(res)) as any;
  if (!res.ok) {
    throw new Error(data.error || data.message || "Upload failed");
  }
  return data;
}

/**
 * Delete an uploaded file. Best-effort by default (form editors use it to clean
 * up replaced images and must not fail on it); pass `{ strict: true }` to throw
 * so the caller can show the real error (Media page).
 */
export async function deleteFileFromMedia(
  public_id: string,
  resource_type: string,
  { strict = false }: { strict?: boolean } = {}
): Promise<void> {
  try {
    const res = await fetch("/api/media", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ public_id, resource_type }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || data.message || "Failed to delete file");
    }
  } catch (error) {
    if (strict) throw error;
    console.error("Error deleting file:", error);
  }
}