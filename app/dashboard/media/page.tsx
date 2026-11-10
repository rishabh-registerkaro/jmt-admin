
"use client";


import { useEffect, useState } from "react";
import { Copy } from "lucide-react";
import { toast } from "sonner";
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
    } catch (err) {
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
    } catch (err: any) {
      toast.error(err.message || "Upload failed", { id: toastId });
    }
  };

  const handleDelete = async (publicId: string, resource_type: string) => {
    const toastId = toast.loading("Deleting file...");

    try {
      await deleteFileFromMedia(publicId, resource_type);
      toast.success("File deleted", { id: toastId });
      setIsModalOpen(false);
      loadAssets(page);
    } catch (err) {
      toast.error("Failed to delete file", { id: toastId });
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
            className="w-full h-full bg-slate-800 rounded-lg"
          ></iframe>
        );

      case "doc":
        return (
          <div className="text-center text-blue-400 text-xl">
            <span className="text-5xl block mb-2">📄</span>
            <a href={asset.secure_url} target="_blank" className="underline">
              Open Document
            </a>
          </div>
        );

      default:
        return (
          <div className="text-center text-slate-300 text-xl">
            <span className="text-5xl block mb-2">📁</span>
            <a href={asset.secure_url} target="_blank" className="underline">
              Download File
            </a>
          </div>
        );
    }
  };

  useEffect(() => {
    loadAssets(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);




  return (
    <div className="flex bg-slate-900 min-h-screen text-white">
      <div className="flex-1 p-8">
        <h1 className="text-3xl font-semibold">Media Library</h1>
        <p className="text-slate-400 mb-6">
          Manage your uploaded images, videos, and documents.
        </p>

        {/* UPLOAD */}
        <div className="bg-slate-800 border border-slate-700 p-8 rounded-xl text-center mb-8">
          <p className="text-slate-400 mb-4">
            Drag & drop files or click to upload
          </p>

          <label className="bg-violet-600 hover:bg-violet-500 px-4 py-2 rounded-md cursor-pointer inline-block">
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
                className="w-full h-32 bg-slate-700 animate-pulse rounded-lg"
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
                  className="group relative rounded-lg bg-slate-800 border border-slate-700 overflow-hidden hover:bg-slate-700 cursor-pointer transition"
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
                        className="absolute top-2 right-2 p-2 bg-black/60 hover:bg-black/80 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 cursor-pointer"
                        title="Copy URL"
                      >
                        <Copy className="h-4 w-4 text-white" />
                      </button>
                    </>
                  ) : (
                    <div className="w-full h-32 bg-slate-700 flex items-center justify-center text-white font-medium">
                      {asset.format.toUpperCase()}
                    </div>
                  )}
                </div>
              );
            })}
        </div>

        {/* PAGINATION */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <span className="text-sm text-slate-400">
              Page {pagination.currentPage} of {pagination.totalPages} •{" "}
              {pagination.totalCount} files
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={!pagination.hasPrevPage || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-4 py-2 rounded-md bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={!pagination.hasNextPage || loading}
                onClick={() => setPage((p) => p + 1)}
                className="px-4 py-2 rounded-md bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* MODAL */}
        {isModalOpen && selectedAsset && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-slate-900 border border-slate-700 rounded-xl w-[900px] h-[520px] flex">
              {/* LEFT: Preview */}
              <div className="w-1/2 p-4 flex items-center justify-center bg-slate-800">
                {renderPreview(selectedAsset)}
              </div>

              {/* RIGHT: Details */}
              <div className="w-1/2 p-6 overflow-y-auto space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">
                    {selectedAsset.filename}
                  </h2>
                  <button
                    className="text-slate-400 hover:text-white"
                    onClick={() => setIsModalOpen(false)}
                  >
                    ✕
                  </button>
                </div>

                <div className="text-sm text-slate-400 space-y-1">
                  <p>
                    <span className="text-slate-300">Public ID:</span>{" "}
                    {selectedAsset.public_id}
                  </p>
                  <p>
                    <span className="text-slate-300">Format:</span>{" "}
                    {selectedAsset.format}
                  </p>
                  <p>
                    <span className="text-slate-300">Size:</span>{" "}
                    {(selectedAsset.bytes / 1024).toFixed(1)} KB
                  </p>
                  <p>
                    <span className="text-slate-300">Created:</span>{" "}
                    {new Date(selectedAsset.created_at).toLocaleString()}
                  </p>
                </div>

                <button
                  className="w-full bg-slate-700 hover:bg-slate-600 py-2 rounded-md cursor-pointer"
                  onClick={() =>
                    navigator.clipboard.writeText(selectedAsset.secure_url)
                  }
                >
                  Copy URL
                </button>

                <button
                  className="w-full bg-red-600 hover:bg-red-500 py-2 rounded-md cursor-pointer"
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
