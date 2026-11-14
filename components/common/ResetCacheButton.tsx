"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { resetAllCache } from "@/lib/revalidateClient";

/**
 * "Reset all cache" — clears every cached page on both websites after a
 * confirmation. The API only allows admins; render this for admins only.
 */
export function ResetCacheButton({ collapsed = false }: { collapsed?: boolean }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    try {
      await resetAllCache();
      setOpen(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={busy}
        title="Reset all cache"
        aria-label="Reset all cache"
        className={cn(
          "flex items-center gap-2.5 rounded-md text-[13px] text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-sidebar-ring disabled:opacity-50",
          collapsed ? "size-10 justify-center" : "w-full px-2.5 py-2",
        )}
      >
        <RotateCcw className={cn("size-4 shrink-0", busy && "animate-spin")} />
        {!collapsed && <span>Reset all cache</span>}
      </button>

      <Dialog open={open} onOpenChange={(v) => !busy && setOpen(v)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset all cache?</DialogTitle>
            <DialogDescription>
              This clears every cached page on the main website and the Joy Maa Tara site. Nothing is
              changed or published. The first visit to each page will be a little slower while it
              rebuilds.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={run} disabled={busy}>
              <RotateCcw className={cn("mr-2 h-4 w-4", busy && "animate-spin")} />
              {busy ? "Resetting…" : "Reset all cache"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
