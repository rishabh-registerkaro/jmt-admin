"use client";

import PackageBlockForm from "../package-block-form";

export default function CreatePackagePage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-950 to-slate-900 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Create Package Block</h1>
          <p className="text-slate-400">
            Build a set of packages and choose which pages it is injected into — start from a
            template or compose the tabs from scratch.
          </p>
        </div>
        <PackageBlockForm mode="create" />
      </div>
    </div>
  );
}
