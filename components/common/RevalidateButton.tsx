"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { revalidateTags } from "@/lib/revalidateClient";

interface RevalidateButtonProps {
  tags: string[];
  /** What is being refreshed, for the tooltip and toast (e.g. "Homepage"). */
  label?: string;
  /** "page" = outlined button with text; "row" = small icon button in a table row. */
  variant?: "page" | "row";
  className?: string;
}

/** Clears the frontend cache for `tags` on both websites. */
export function RevalidateButton({ tags, label, variant = "page", className }: RevalidateButtonProps) {
  const [busy, setBusy] = useState(false);
  const title = label ? `Clear frontend cache for ${label}` : "Clear frontend cache";

  const onClick = async () => {
    setBusy(true);
    try {
      await revalidateTags(tags, label);
    } finally {
      setBusy(false);
    }
  };

  if (variant === "row") {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onClick}
        disabled={busy}
        title={title}
        aria-label={title}
        className={cn("text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer", className)}
      >
        <RefreshCw className={cn("w-4 h-4", busy && "animate-spin")} />
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      disabled={busy}
      title={title}
      className={cn("border-warning/40 text-warning hover:bg-warning/10 hover:text-warning", className)}
    >
      <RefreshCw className={cn("h-4 w-4 mr-2", busy && "animate-spin")} />
      Revalidate Cache
    </Button>
  );
}
