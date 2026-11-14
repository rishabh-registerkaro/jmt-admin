
"use client";


import { useEffect, useState } from "react";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { toApiError } from "@/app/dashboard/_lib/api-error";
import { RevalidateButton } from "@/components/common/RevalidateButton";
import { Asset } from "@/app/types/media";
import { deleteFileFromMedia, uploadFileToMedia } from "@/app/lib/utils/media";



export default function MediaLibrary() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  function getAssetType(format: string) {
    const f = format?.toLowerCase();

    if (
      ["jpg", "jpeg", "png", "webp", "gif", "bmp", "svg"].includes(f)
    )
      return "image";

    if (["mp4", "webm", "mov", "avi"].includes(f)) return "video";

    if (f === "pdf") return "pdf";

    if (["doc", "docx"].includes(f)) return "doc";

    if (["zip", "rar", "7z"].includes(f)) return "archive";

    return "other";
  }
  const loadAssets = async (targetPage: number = page) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/media?page=${targetPage}&limit=24`);
      const data = await res.json();
      setAssets(data?.result?.resources || []);
      if (data?.result?.pagination) setPagination(data.result.pagination);
    } catch {
      toast.error("Failed to load media");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const toastId = toast.loading("Uploading...");

    try {
      await uploadFileToMedia(file);
      toast.success("Upload successful!", { id: toastId });
      // New uploads sort first — jump to page 1
      setPage(1);
      loadAssets(1);
    } catch (err) {
      toast.error(toApiError(err).message || "Upload failed", { id: toastId });
    }
  };

  const handleDelete = async (publicId: string, resource_type: string) => {
    const toastId = toast.loading("Deleting file...");

    try {
      await deleteFileFromMedia(publicId, resource_type, { strict: true });
      toast.success("File deleted", { id: toastId });
      setIsModalOpen(false);
      loadAssets(page);
    } catch (err) {
      toast.error((err as Error)?.message || "Failed to delete file", { id: toastId });
    }
  };

 
  const renderPreview = (asset: Asset) => {
    const type = getAssetType(asset.format);

    switch (type) {
      case "image":
        return (
          <img
            src={asset.secure_url}
            alt={asset.filename}
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        );

      case "video":
        return (
          <video
            src={asset.secure_url}
            controls
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        );

      case "pdf":
        return (
          <iframe
            src={asset.secure_url}
            className="w-full h-full bg-muted rounded-lg"
          ></iframe>
        );

      case "doc":
        return (
          <div className="text-center text-brand-link text-xl">
            <span className="text-5xl block mb-2">📄</span>
            <a href={asset.secure_url} target="_blank" className="underline">
              Open Document
            </a>
          </div>
        );

      default:
        return (
          <div className="text-center text-foreground-light text-xl">
            <span className="text-5xl block mb-2">📁</span>
            <a href={asset.secure_url} target="_blank" className="underline">
              Download File
            </a>
          </div>
        );
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on mount/dependency change; the fetcher sets state
    loadAssets(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);




  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <div className="flex-1 min-w-0 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">Media Library</h1>
            <p className="text-sm text-muted-foreground">
              Manage your uploaded images, videos, and documents.
            </p>
          </div>
          <RevalidateButton label="homepage images" tags={["homepage-media"]} className="shrink-0" />
        </div>

        {/* UPLOAD */}
        <div className="rounded-lg border border-dashed border-border-strong bg-card p-6 sm:p-8 text-center mb-8">
          <p className="text-muted-foreground mb-4">
            Drag & drop files or click to upload
          </p>

          <label className="inline-flex h-8 cursor-pointer items-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Upload File
            <input type="file" className="hidden" onChange={handleUpload} />
          </label>
        </div>

        {/* GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {loading &&
            [...Array(12)].map((_, i) => (
              <div
                key={i}
                className="w-full h-32 bg-muted animate-pulse rounded-lg"
              />
            ))}

          {!loading &&
            assets.map((asset) => {
              const type = getAssetType(asset.format);

              const handleCopyUrl = (e: React.MouseEvent) => {
                e.stopPropagation(); // Prevent opening modal
                navigator.clipboard.writeText(asset.secure_url);
                toast.success("URL copied to clipboard", {
                  closeButton: true,
                });
              };


              return (
                <div
                  key={asset.asset_id}
                  className="group relative rounded-lg border bg-card overflow-hidden hover:border-border-strong cursor-pointer transition"
                  onClick={() => {
                    setSelectedAsset(asset);
                    setIsModalOpen(true);
                  }}
                >
                  {type === "image" ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={asset.secure_url}
                        alt={asset.filename}
                        className="w-full h-32 object-cover"
                      />
                      <button
                        onClick={handleCopyUrl}
                        className="absolute top-2 right-2 p-2 border bg-background/90 text-foreground hover:bg-muted rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 cursor-pointer"
                        title="Copy URL"
                      >
                        <Copy className="h-4 w-4 text-foreground" />
                      </button>
                    </>
                  ) : (
                    <div className="w-full h-32 bg-muted/50 flex items-center justify-center text-muted-foreground text-sm font-medium">
                      {asset.format.toUpperCase()}
                    </div>
                  )}
                </div>
              );
            })}
        </div>

        {/* PAGINATION */}
        {pagination.totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-3 mt-6">
            <span className="text-sm text-muted-foreground">
              Page {pagination.currentPage} of {pagination.totalPages} •{" "}
              {pagination.totalCount} files
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={!pagination.hasPrevPage || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-8 px-3 text-sm rounded-md border border-border-strong bg-background text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={!pagination.hasNextPage || loading}
                onClick={() => setPage((p) => p + 1)}
                className="h-8 px-3 text-sm rounded-md border border-border-strong bg-background text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* MODAL */}
        {isModalOpen && selectedAsset && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card border rounded-lg w-full max-w-[900px] max-h-[90vh] overflow-y-auto md:overflow-visible md:h-[520px] flex flex-col md:flex-row">
              {/* LEFT: Preview */}
              <div className="w-full md:w-1/2 h-56 md:h-auto shrink-0 p-4 flex items-center justify-center bg-muted/50">
                {renderPreview(selectedAsset)}
              </div>

              {/* RIGHT: Details */}
              <div className="w-full md:w-1/2 p-4 sm:p-6 md:overflow-y-auto space-y-4">
                <div className="flex justify-between items-center gap-3">
                  <h2 className="text-base font-semibold text-foreground min-w-0 break-words">
                    {selectedAsset.filename}
                  </h2>
                  <button
                    className="shrink-0 text-muted-foreground hover:text-foreground"
                    onClick={() => setIsModalOpen(false)}
                  >
                    ✕
                  </button>
                </div>

                <div className="text-sm text-muted-foreground space-y-1 break-words">
                  <p>
                    <span className="text-foreground-light">Public ID:</span>{" "}
                    {selectedAsset.public_id}
                  </p>
                  <p>
                    <span className="text-foreground-light">Format:</span>{" "}
                    {selectedAsset.format}
                  </p>
                  <p>
                    <span className="text-foreground-light">Size:</span>{" "}
                    {(selectedAsset.bytes / 1024).toFixed(1)} KB
                  </p>
                  <p>
                    <span className="text-foreground-light">Created:</span>{" "}
                    {new Date(selectedAsset.created_at).toLocaleString()}
                  </p>
                </div>

                <button
                  className="w-full h-8 rounded-md border border-border-strong bg-background text-sm font-medium text-foreground hover:bg-muted cursor-pointer"
                  onClick={() =>
                    navigator.clipboard.writeText(selectedAsset.secure_url)
                  }
                >
                  Copy URL
                </button>

                <button
                  className="w-full h-8 rounded-md bg-destructive text-sm font-medium text-white hover:bg-destructive/90 cursor-pointer"
                  onClick={() => handleDelete(selectedAsset.public_id, selectedAsset.resource_type)}
                >
                  Delete File
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
