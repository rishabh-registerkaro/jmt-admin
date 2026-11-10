"use client";

import ServicePageForm from "../service-page-form";

export default function CreateServicePage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-950 to-slate-900 p-4 sm:p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Create Service Page</h1>
          <p className="text-slate-400">
            Build a division / service page that matches the JMT frontend layout —
            start from a template or compose sections from scratch.
          </p>
        </div>
        <ServicePageForm mode="create" />
      </div>
    </div>
  );
}
