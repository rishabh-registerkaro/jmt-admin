"use client";

// Browse the Media Library and pick an image, or upload a new one.
// Reusable by any editor: <MediaPickerDialog open onOpenChange onSelect />.

import { useEffect, useRef, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Loader2, Search, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { uploadFileToMedia } from "@/app/lib/utils/media";
import type { Asset } from "@/app/types/media";

const PAGE_SIZE = 24;

interface MediaPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (asset: { url: string; filename: string }) => void;
}

export default function MediaPickerDialog({ open, onOpenChange, onSelect }: MediaPickerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-slate-700 bg-slate-900 text-white sm:max-w-4xl">
        {/* Mounted only while open, so search/page/selection reset on every open. */}
        {open && (
          <PickerBody
            onCancel={() => onOpenChange(false)}
            onChoose={(asset) => {
              onSelect(asset);
              onOpenChange(false);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

interface PageResult {
  key: string;
  assets: Asset[];
  totalPages: number;
}

function PickerBody({
  onCancel,
  onChoose,
}: {
  onCancel: () => void;
  onChoose: (asset: { url: string; filename: string }) => void;
}) {
  const [result, setResult] = useState<PageResult | null>(null);
  const [uploading, setUploading] = useState(false);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Asset | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const requestKey = `${page}|${search}`;
  const loading = result?.key !== requestKey;
  const assets = result?.assets ?? [];
  const totalPages = result?.totalPages ?? 1;

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE), type: "image" });
    if (search) params.set("search", search);

    fetch(`/api/media?${params}`, { credentials: "include" })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || data.error || "Failed to load media");
        return data;
      })
      .then((data) => {
        if (cancelled) return;
        setResult({
          key: requestKey,
          assets: data?.result?.resources ?? [],
          totalPages: Math.max(1, data?.result?.pagination?.totalPages ?? 1),
        });
      })
      .catch((error: Error) => {
        if (cancelled) return;
        toast.error(error.message || "Failed to load media");
        setResult({ key: requestKey, assets: [], totalPages: 1 });
      });

    return () => {
      cancelled = true;
    };
  }, [page, search, requestKey]);

  // Debounce the search box.
  useEffect(() => {
    const term = query.trim();
    if (term === search) return;
    const timer = setTimeout(() => {
      setSearch(term);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  const choose = (url: string, filename: string) => onChoose({ url, filename });

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    setUploading(true);
    const toastId = toast.loading("Uploading...");
    try {
      const { url } = await uploadFileToMedia(file);
      toast.success("Uploaded", { id: toastId });
      choose(url, file.name);
    } catch (error) {
      toast.error((error as Error).message || "Upload failed", { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Choose an image</DialogTitle>
        <DialogDescription className="text-slate-400">
          Pick from the Media Library or upload a new image.
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by file name"
            className="w-full rounded-lg border border-slate-600 bg-slate-800 py-2 pl-9 pr-3 text-sm text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleUpload} />
        <Button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="bg-indigo-500 text-white hover:bg-indigo-600"
        >
          {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
          Upload new
        </Button>
      </div>

      <div className="min-h-[280px] overflow-y-auto" style={{ maxHeight: "52vh" }}>
        {loading ? (
          <div className="flex h-64 items-center justify-center text-slate-400">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading...
          </div>
        ) : assets.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-sm text-slate-400">
            {search ? "No images match your search." : "No images in the Media Library yet."}
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {assets.map((asset) => {
              const isSelected = selected?.asset_id === asset.asset_id;
              return (
                <li key={asset.asset_id}>
                  <button
                    type="button"
                    onClick={() => setSelected(asset)}
                    onDoubleClick={() => choose(asset.secure_url, asset.filename)}
                    title={asset.filename}
                    className={`group relative block aspect-square w-full overflow-hidden rounded-lg border-2 bg-slate-800 ${
                      isSelected ? "border-indigo-400" : "border-transparent hover:border-slate-500"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={asset.secure_url} alt={asset.filename} loading="lazy" className="h-full w-full object-cover" />
                    {isSelected && (
                      <span className="absolute right-1 top-1 rounded-full bg-indigo-500 p-0.5">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    )}
                    <span className="absolute inset-x-0 bottom-0 truncate bg-black/60 px-1.5 py-0.5 text-left text-[11px] text-slate-200">
                      {asset.filename}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => p - 1)}
            className="text-slate-300 hover:bg-white/10 hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          Page {page} of {totalPages}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => p + 1)}
            className="text-slate-300 hover:bg-white/10 hover:text-white"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="border-slate-600 bg-transparent text-slate-200 hover:bg-slate-800 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!selected}
            onClick={() => selected && choose(selected.secure_url, selected.filename)}
            className="bg-indigo-500 text-white hover:bg-indigo-600"
          >
            Use selected image
          </Button>
        </div>
      </div>
    </>
  );
}
