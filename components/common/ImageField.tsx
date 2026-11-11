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
  "w-full rounded-md border border-input bg-transparent dark:bg-input/30 px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-brand/60 focus-visible:ring-2 focus-visible:ring-ring";
const btnCls = "";

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
      <span className="block text-sm font-medium text-foreground">{label}</span>
      <div className="flex flex-col gap-4 rounded-lg border border-border bg-muted/40 p-3 sm:flex-row">
        <div className="relative flex h-32 w-full shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted sm:w-48">
          {previewSrc && !urlInvalid ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewSrc}
              alt={value.alt}
              className="h-full w-full object-cover"
              style={{ objectPosition: value.focus === "upper" ? "center 20%" : value.focus }}
            />
          ) : (
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
          )}
          {usingDefault && (
            <span className="absolute left-1.5 top-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[11px] text-white">
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
                className="text-muted-foreground hover:bg-accent hover:text-foreground"
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
            <p className="text-xs text-destructive">Use a full https:// URL or a path starting with “/”.</p>
          )}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
            <input
              className={inputCls}
              value={value.alt}
              placeholder="Alt text — describe the photo for screen readers"
              onChange={(e) => onChange({ ...value, alt: e.target.value })}
            />
            <select
              className="rounded-md border border-input bg-transparent dark:bg-input/30 px-3 py-1.5 text-sm text-foreground focus-visible:outline-none focus-visible:border-brand/60 focus-visible:ring-2 focus-visible:ring-ring"
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
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
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
