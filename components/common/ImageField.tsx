"use client";

// Image input for CMS editors: preview, pick from the Media Library, upload,
// or paste a URL; plus alt text and crop focus. An empty `src` means "use the
// default image" (shown greyed in the preview when `defaultSrc` is given).

import { useRef, useState } from "react";
import { ImageIcon, Images, Loader2, RotateCcw, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import MediaPickerDialog from "@/components/common/MediaPickerDialog";
import { uploadFileToMedia } from "@/app/lib/utils/media";
import {
  IMAGE_FOCUS_OPTIONS,
  isSafeImageSrc,
  type HomeImageValue,
} from "@/app/lib/content/home-content";

const inputCls =
  "w-full rounded-lg border border-slate-600 bg-slate-900/60 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-indigo-500";
const btnCls = "border-slate-600 bg-slate-800/60 text-slate-200 hover:bg-slate-700 hover:text-white";

interface ImageFieldProps {
  label: string;
  value: HomeImageValue;
  onChange: (value: HomeImageValue) => void;
  /** Image used when `src` is empty. Without it, empty means "no image". */
  defaultSrc?: string;
  hint?: string;
}

export default function ImageField({ label, value, onChange, defaultSrc, hint }: ImageFieldProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const usingDefault = !value.src && Boolean(defaultSrc);
  const previewSrc = value.src || defaultSrc || "";
  const urlInvalid = Boolean(value.src) && !isSafeImageSrc(value.src);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    setUploading(true);
    const toastId = toast.loading("Uploading image...");
    try {
      const { url } = await uploadFileToMedia(file);
      onChange({ ...value, src: url });
      toast.success("Image uploaded", { id: toastId });
    } catch (error) {
      toast.error((error as Error).message || "Upload failed", { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <span className="block text-sm font-medium text-slate-200">{label}</span>
      <div className="flex flex-col gap-4 rounded-lg border border-slate-700 bg-slate-900/40 p-3 sm:flex-row">
        <div className="relative flex h-32 w-full shrink-0 items-center justify-center overflow-hidden rounded-md bg-slate-800 sm:w-48">
          {previewSrc && !urlInvalid ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewSrc}
              alt={value.alt}
              className="h-full w-full object-cover"
              style={{ objectPosition: value.focus === "upper" ? "center 20%" : value.focus }}
            />
          ) : (
            <ImageIcon className="h-8 w-8 text-slate-600" />
          )}
          {usingDefault && (
            <span className="absolute left-1.5 top-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[11px] text-slate-200">
              Default
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" className={btnCls} onClick={() => setPickerOpen(true)}>
              <Images className="mr-1.5 h-4 w-4" /> Media Library
            </Button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleUpload} />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={btnCls}
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Upload className="mr-1.5 h-4 w-4" />}
              Upload
            </Button>
            {value.src && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-slate-400 hover:bg-white/10 hover:text-white"
                onClick={() => onChange({ ...value, src: "" })}
              >
                <RotateCcw className="mr-1.5 h-4 w-4" /> {defaultSrc ? "Use default" : "Remove"}
              </Button>
            )}
          </div>
          <input
            className={inputCls}
            value={value.src}
            placeholder={defaultSrc ? "Using the default image — or paste an image URL" : "https://… image URL"}
            onChange={(e) => onChange({ ...value, src: e.target.value })}
          />
          {urlInvalid && (
            <p className="text-xs text-red-400">Use a full https:// URL or a path starting with “/”.</p>
          )}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
            <input
              className={inputCls}
              value={value.alt}
              placeholder="Alt text — describe the photo for screen readers"
              onChange={(e) => onChange({ ...value, alt: e.target.value })}
            />
            <select
              className="rounded-lg border border-slate-600 bg-slate-900/60 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500"
              value={value.focus}
              title="Which part of the photo stays visible when it is cropped"
              onChange={(e) => onChange({ ...value, focus: e.target.value as HomeImageValue["focus"] })}
            >
              {IMAGE_FOCUS_OPTIONS.map((focus) => (
                <option key={focus} value={focus}>
                  Focus: {focus}
                </option>
              ))}
            </select>
          </div>
          {hint && <p className="text-xs text-slate-500">{hint}</p>}
        </div>
      </div>

      <MediaPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={({ url }) => onChange({ ...value, src: url })}
      />
    </div>
  );
}
