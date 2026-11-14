"use client";

import  { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent, ChangeEvent } from "react";

interface SignupFormState {
  email: string;
  username: string;
  password: string;
}

export default function SignupPage() {
    const router=useRouter();
  const [form, setForm] = useState<SignupFormState>({
    email: "",
    username: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        alert("Signup Successful! Redirecting to login...");
        router.push("/login"); 
      } else {
        alert(data.message || "Signup failed");
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 sm:p-8">
        <h1 className="text-2xl font-semibold tracking-tight text-center text-foreground mb-2">
          Create an account
        </h1>
        <p className="text-center text-foreground-light mb-8 text-sm">
          Sign up to continue to your dashboard.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div className="space-y-1">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-foreground-light"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-border-strong bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring focus:border-ring"
            />
          </div>

          {/* Username */}
          <div className="space-y-1">
            <label
              htmlFor="username"
              className="block text-sm font-medium text-foreground-light"
            >
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              value={form.username}
              onChange={handleChange}
              placeholder="your_username"
              className="w-full rounded-lg border border-border-strong bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring focus:border-ring"
            />
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-foreground-light"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              minLength={8}
              required
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full rounded-lg border border-border-strong bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring focus:border-ring"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-md bg-primary py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-foreground-light">
          Already have an account?{" "}
          <a
            href="/login"
            className="font-semibold text-brand-link hover:underline"
          >
            Log in
          </a>
        </p>
      </div>
    </div>
  );
}
