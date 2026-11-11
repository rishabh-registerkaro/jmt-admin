"use client";

import PackageBlockForm from "../package-block-form";

export default function CreatePackagePage() {
  return (
    <div className="min-h-screen w-full bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Create Package Block</h1>
          <p className="text-muted-foreground">
            Build a set of packages and choose which pages it is injected into — start from a
            template or compose the tabs from scratch.
          </p>
        </div>
        <PackageBlockForm mode="create" />
      </div>
    </div>
  );
}
