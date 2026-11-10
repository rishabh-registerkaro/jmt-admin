"use client";

import { useState } from "react";
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
      className: "!bg-transparent !text-white",
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
          className: "!bg-transparent !text-white",
        });

        setTimeout(() => {
          router.push("/dashboard");
        }, 1000);
      } else {
        // Dismiss loading toast
        toast.dismiss(loadingToastId);

        toast.error(data.message || "Login failed", {
          duration: 4000,
          className: "!bg-transparent !text-white",
        });
      }
    } catch (error) {
      console.error(error);
      // Dismiss loading toast
      toast.dismiss(loadingToastId);
      
      toast.error("Something went wrong. Please try again.", {
        duration: 4000,
        className: "!bg-transparent !text-white",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 px-4">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-xl">

        <h1 className="text-3xl font-bold text-center text-white mb-2">
          Welcome Back
        </h1>
        <p className="text-center text-slate-300 mb-8 text-sm">
          Login to access your dashboard.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email or Username */}
          <div className="space-y-1">
            <label className="text-sm text-slate-200">Email</label>
            <input
              type="text"
              name="email"
              required
              value={form.email || ""}
              onChange={handleChange}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-slate-600 bg-slate-900/60 px-3 py-2 text-sm text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-slate-200">Username (optional)</label>
            <input
              type="text"
              name="username"
              value={form.username || ""}
              onChange={handleChange}
              placeholder="Optional if email entered"
              className="w-full rounded-lg border border-slate-600 bg-slate-900/60 px-3 py-2 text-sm text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Password */}
          <div className="space-y-1 relative">
            <label className="text-sm text-slate-200">Password</label>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              required
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full rounded-lg border border-slate-600 bg-slate-900/60 px-3 py-2 text-sm text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button type="button" className="absolute right-3 top-[53%] cursor-pointer  text-slate-400 hover:text-slate-200 transition-colors focus:outline-none" onClick={togglePasswordVisibility}>
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {/* Add this after password field, before submit button */}
          <div className="flex items-center justify-end">
            <Link
              href="/forgot-password"
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 rounded-lg bg-indigo-500 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-600 transition disabled:bg-slate-600 disabled:cursor-not-allowed"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* <p className="text-center text-xs text-slate-300 mt-6">
          Don't have an account?{" "}
          <a href="/signup" className="font-semibold text-indigo-400 hover:text-indigo-300">
            Sign Up
          </a>
        </p> */}
      </div>
    </div>
  );
}
