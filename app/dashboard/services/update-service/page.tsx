"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import ServicePageForm, {
  normalizeContent,
  type ServicePageFormData,
} from "../service-page-form";

function UpdateServiceLoading() {
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

function UpdateServiceInner() {
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug") || "";

  const [initialData, setInitialData] = useState<ServicePageFormData | null>(null);
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setError("No slug provided in the URL.");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/services/${slug}`, { credentials: "include" });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(data.message || "Failed to load the service page.");
          return;
        }
        const page = data.data;
        setInitialData({
          slug: page.slug ?? slug,
          template: page.template ?? "division",
          metaTitle: page.metaTitle ?? "",
          metaDescription: page.metaDescription ?? "",
          content: normalizeContent(page.content),
        });
        setStatus(page.status === "published" ? "published" : "draft");
      } catch {
        if (!cancelled) setError("Failed to load the service page.");
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
            <Link href="/dashboard/services">Back to Services</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!initialData) return <UpdateServiceLoading />;

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-950 to-slate-900 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Update Service</h1>
            <p className="text-slate-400 flex items-center gap-2">
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
            </p>
          </div>
          <Button asChild className="bg-indigo-500 hover:bg-indigo-600 text-white">
            <Link href="/dashboard/services/create-service">Create New Service</Link>
          </Button>
        </div>
        <ServicePageForm mode="update" initialData={initialData} originalSlug={slug} />
      </div>
    </div>
  );
}

export default function UpdateServicePage() {
  return (
    <Suspense fallback={<UpdateServiceLoading />}>
      <UpdateServiceInner />
    </Suspense>
  );
}
