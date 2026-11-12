"use client";

import { useEffect, useState } from "react";
import type { FormEvent, ChangeEvent } from "react";

import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface LoginFormData {
  email?: string;
  username?: string;
  password: string;
}

export default function LoginPage() {
  const router = useRouter();

  const [form, setForm] = useState<LoginFormData>({
    email: "",
    username: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Set by components/common/SessionTimeout.tsx after an idle sign-out.
  // Read from window (not useSearchParams) so the page needs no Suspense boundary.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("reason") === "timeout") {
      toast.info("You were signed out due to inactivity. Please log in again.", {
        id: "session-timeout",
        duration: 6000,
        className: "!bg-transparent !text-foreground",
      });
      window.history.replaceState(null, "", "/login");
    }
  }, []);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const loadingToastId = toast.loading("Logging in...", {
      className: "!bg-transparent !text-foreground",
    });

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        // alert("Login Successful");
        toast.dismiss(loadingToastId);
        toast.success("Login Successful", {
          closeButton: true,
          duration: 2000,
          className: "!bg-transparent !text-foreground",
        });

        setTimeout(() => {
          router.push("/dashboard");
        }, 1000);
      } else {
        // Dismiss loading toast
        toast.dismiss(loadingToastId);

        toast.error(data.message || "Login failed", {
          duration: 4000,
          className: "!bg-transparent !text-foreground",
        });
      }
    } catch (error) {
      console.error(error);
      // Dismiss loading toast
      toast.dismiss(loadingToastId);
      
      toast.error("Something went wrong. Please try again.", {
        duration: 4000,
        className: "!bg-transparent !text-foreground",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 sm:p-8">

        <h1 className="text-2xl font-semibold tracking-tight text-center text-foreground mb-2">
          Welcome Back
        </h1>
        <p className="text-center text-foreground-light mb-8 text-sm">
          Login to access your dashboard.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email or Username */}
          <div className="space-y-1">
            <label className="text-sm text-foreground-light">Email</label>
            <input
              type="text"
              name="email"
              required
              value={form.email || ""}
              onChange={handleChange}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-border-strong bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-foreground-light">Username (optional)</label>
            <input
              type="text"
              name="username"
              value={form.username || ""}
              onChange={handleChange}
              placeholder="Optional if email entered"
              className="w-full rounded-lg border border-border-strong bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Password */}
          <div className="space-y-1 relative">
            <label className="text-sm text-foreground-light">Password</label>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              required
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full rounded-lg border border-border-strong bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
            />
            <button type="button" className="absolute right-3 top-[53%] cursor-pointer text-muted-foreground hover:text-foreground-light transition-colors focus:outline-none" onClick={togglePasswordVisibility}>
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {/* Add this after password field, before submit button */}
          <div className="flex items-center justify-end">
            <Link
              href="/forgot-password"
              className="text-xs text-brand-link hover:underline transition-colors"
            >
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 rounded-md bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* <p className="text-center text-xs text-foreground-light mt-6">
          Don't have an account?{" "}
          <a href="/signup" className="font-semibold text-brand-link hover:underline">
            Sign Up
          </a>
        </p> */}
      </div>
    </div>
  );
}
