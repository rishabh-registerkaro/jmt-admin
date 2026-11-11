"use client";

import ServicePageForm from "../service-page-form";

export default function CreateServicePage() {
  return (
    <div className="min-h-screen w-full bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Create Service Page</h1>
          <p className="text-muted-foreground">
            Build a division / service page that matches the JMT frontend layout —
            start from a template or compose sections from scratch.
          </p>
        </div>
        <ServicePageForm mode="create" />
      </div>
    </div>
  );
}
