"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import PackageBlockForm, {
  normalizeContent,
  type PackageBlockFormData,
} from "../package-block-form";

function UpdatePackageLoading() {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-950 to-slate-900 p-6">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="h-9 w-64 bg-slate-700 rounded animate-pulse" />
        <div className="h-40 bg-slate-800/60 rounded-2xl animate-pulse" />
        <div className="h-72 bg-slate-800/60 rounded-2xl animate-pulse" />
      </div>
    </div>
  );
}

function UpdatePackageInner() {
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug") || "";

  const [initialData, setInitialData] = useState<PackageBlockFormData | null>(null);
  const [status, setStatus] = useState<"draft" | "published">("draft");
  // A missing slug is knowable on the first render — seeded here rather than
  // set from the effect, which would cost an extra render pass.
  const [error, setError] = useState<string | null>(
    slug ? null : "No slug provided in the URL."
  );

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/packages/${slug}`, { credentials: "include" });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(data.message || "Failed to load the package block.");
          return;
        }
        const block = data.data;
        setInitialData({
          slug: block.slug ?? slug,
          title: block.title ?? "",
          targetPages: Array.isArray(block.targetPages) ? block.targetPages : [],
          // Blocks saved before the toggle existed have no value — treat those
          // as visible so nothing silently disappears from the live site.
          visible: block.visible !== false,
          content: normalizeContent(block.content),
        });
        setStatus(block.status === "published" ? "published" : "draft");
      } catch {
        if (!cancelled) setError("Failed to load the package block.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (error) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-950 to-slate-900 p-6 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-slate-300">{error}</p>
          <Button asChild className="bg-indigo-500 hover:bg-indigo-600 text-white">
            <Link href="/dashboard/packages">Back to Packages</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!initialData) return <UpdatePackageLoading />;

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-950 to-slate-900 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Update Package Block</h1>
            <p className="text-slate-400 flex items-center gap-2 flex-wrap">
              Editing <code className="text-indigo-300">{initialData.slug}</code>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  status === "published"
                    ? "bg-green-500/20 text-green-300"
                    : "bg-yellow-500/20 text-yellow-300"
                }`}
              >
                {status === "published" ? "Published" : "Draft"}
              </span>
              {initialData.targetPages.length > 0 && (
                <span className="text-xs text-slate-500">
                  on {initialData.targetPages.map((p) => `/${p}`).join(", ")}
                </span>
              )}
            </p>
          </div>
          <Button asChild className="bg-indigo-500 hover:bg-indigo-600 text-white">
            <Link href="/dashboard/packages/create-package">Create New Block</Link>
          </Button>
        </div>
        <PackageBlockForm mode="update" initialData={initialData} originalSlug={slug} />
      </div>
    </div>
  );
}

export default function UpdatePackagePage() {
  return (
    <Suspense fallback={<UpdatePackageLoading />}>
      <UpdatePackageInner />
    </Suspense>
  );
}
