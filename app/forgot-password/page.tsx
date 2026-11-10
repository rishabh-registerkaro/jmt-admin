"use client";

import { useState, FormEvent, ChangeEvent, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { requestOTP, verifyOTP, resetPassword } from "@/lib/apiCallingPassword";
import axios from "axios";

type Step = "email" | "otp" | "newPassword";

export default function ForgotPasswordPage() {
  const router = useRouter();

  // Step management
  const [step, setStep] = useState<Step>("email");

  // Form data
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI states
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpResendTimer, setOtpResendTimer] = useState(0);

  // AbortController refs for cancelling requests
  const abortControllerRef = useRef<AbortController | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Helper function to check if request was cancelled
  const isCancelled = useCallback((error: any): boolean => {
    if (!error) return false;
    return (
      axios.isCancel(error) ||
      error.name === 'AbortError' ||
      error.code === 'ERR_CANCELED' ||
      error.message === 'canceled'
    );
  }, []);

  // Cleanup function to cancel requests and timers
  const cleanup = useCallback(() => {
    // Cancel ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Only update state if component is still mounted
    if (isMountedRef.current) {
      setLoading(false);
      setOtpResendTimer(0);
    }
  }, []);

  // Helper function to start OTP resend timer
  const startResendTimer = useCallback(() => {
    // Clear existing timer first
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setOtpResendTimer(60);
    timerRef.current = setInterval(() => {
      if (!isMountedRef.current) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        return;
      }
      setOtpResendTimer((prev) => {
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // Cleanup on unmount and handle browser navigation
  useEffect(() => {
    isMountedRef.current = true;

    // Handle browser back/forward button
    const handlePopState = () => {
      cleanup();
    };

    // Handle page visibility change (tab switch, minimize, etc.)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Optional: cancel requests when tab is hidden
        // cleanup();
      }
    };

    window.addEventListener("popstate", handlePopState);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup on unmount
    return () => {
      isMountedRef.current = false;
      cleanup();
      window.removeEventListener("popstate", handlePopState);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [cleanup]);

  // Cleanup timer when step changes manually
  useEffect(() => {
    // If step changes to email, clear the timer
    if (step === "email") {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        setOtpResendTimer(0);
      }
    }
  }, [step]);

  // Helper function to create abort controller safely
  const createAbortController = useCallback(() => {
    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new AbortController
    abortControllerRef.current = new AbortController();
    return abortControllerRef.current.signal;
  }, []);

  // Step 1: Request OTP
  const handleRequestOTP = async (e: FormEvent) => {
    e.preventDefault();
    
    const signal = createAbortController();
    setLoading(true);

    try {
      const response = await requestOTP({ email }, signal);

      // Check if component is still mounted
      if (!isMountedRef.current) return;

      // Check if request was cancelled
      if (response.message === "Request cancelled" || signal.aborted) {
        return;
      }

      if (response.success) {
        toast.success("OTP sent to your email", {
          description: "Please check your inbox for the 6-digit code",
          duration: 5000,
          className: "!bg-transparent !text-white",
        });
        setStep("otp");
        startResendTimer();
      } else {
        toast.error(response.message || "Failed to send OTP", {
          duration: 4000,
          className: "!bg-transparent !text-white",
        });
      }
    } catch (error: any) {
      // Don't show error if request was cancelled or component unmounted
      if (isCancelled(error) || !isMountedRef.current) {
        return;
      }
      console.error("Request OTP error:", error);
      toast.error("Something went wrong. Please try again.", {
        duration: 4000,
        className: "!bg-transparent !text-white",
      });
    } finally {
      if (!signal.aborted && isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e: FormEvent) => {
    e.preventDefault();
    
    const signal = createAbortController();
    setLoading(true);

    try {
      const response = await verifyOTP({ email, otp }, signal);

      // Check if component is still mounted
      if (!isMountedRef.current) return;

      // Check if request was cancelled
      if (response.message === "Request cancelled" || signal.aborted) {
        return;
      }

      if (response.success) {
        toast.success("OTP verified successfully", {
          description: "You can now set your new password",
          duration: 3000,
          className: "!bg-transparent !text-white",
        });
        setStep("newPassword");
      } else {
        toast.error(response.message || "Invalid OTP", {
          duration: 4000,
          className: "!bg-transparent !text-white",
        });
      }
    } catch (error: any) {
      // Don't show error if request was cancelled or component unmounted
      if (isCancelled(error) || !isMountedRef.current) {
        return;
      }
      console.error("Verify OTP error:", error);
      toast.error("Something went wrong. Please try again.", {
        duration: 4000,
        className: "!bg-transparent !text-white",
      });
    } finally {
      if (!signal.aborted && isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();

    // Validation
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match", {
        duration: 4000,
        className: "!bg-transparent !text-white",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters", {
        duration: 4000,
        className: "!bg-transparent !text-white",
      });
      return;
    }

    const signal = createAbortController();
    setLoading(true);

    try {
      const response = await resetPassword({ email, newPassword }, signal);

      // Check if component is still mounted
      if (!isMountedRef.current) return;

      // Check if request was cancelled
      if (response.message === "Request cancelled" || signal.aborted) {
        return;
      }

      if (response.success) {
        toast.success("Password reset successfully!", {
          description: "Redirecting to login page...",
          duration: 3000,
          className: "!bg-transparent !text-white",
        });

        // Redirect to login after 2 seconds
        const redirectTimer = setTimeout(() => {
          if (isMountedRef.current) {
            cleanup(); // Cleanup before redirect
            router.push("/login");
          }
        }, 2000);

        // Store redirect timer for cleanup if needed
        return () => clearTimeout(redirectTimer);
      } else {
        toast.error(response.message || "Failed to reset password", {
          duration: 4000,
          className: "!bg-transparent !text-white",
        });
      }
    } catch (error: any) {
      // Don't show error if request was cancelled or component unmounted
      if (isCancelled(error) || !isMountedRef.current) {
        return;
      }
      console.error("Reset password error:", error);
      toast.error("Something went wrong. Please try again.", {
        duration: 4000,
        className: "!bg-transparent !text-white",
      });
    } finally {
      if (!signal.aborted && isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    if (otpResendTimer > 0) return;

    const signal = createAbortController();
    setLoading(true);
    
    try {
      const response = await requestOTP({ email }, signal);

      // Check if component is still mounted
      if (!isMountedRef.current) return;

      // Check if request was cancelled
      if (response.message === "Request cancelled" || signal.aborted) {
        return;
      }

      if (response.success) {
        toast.success("OTP resent to your email", {
          duration: 3000,
          className: "!bg-transparent !text-white",
        });
        startResendTimer();
      } else {
        toast.error(response.message || "Failed to resend OTP", {
          duration: 4000,
          className: "!bg-transparent !text-white",
        });
      }
    } catch (error: any) {
      // Don't show error if request was cancelled or component unmounted
      if (isCancelled(error) || !isMountedRef.current) {
        return;
      }
      toast.error("Something went wrong. Please try again.", {
        duration: 4000,
        className: "!bg-transparent !text-white",
      });
    } finally {
      if (!signal.aborted && isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  // Format OTP input (only numbers, max 6 digits)
  const handleOtpChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setOtp(value);
  };

  // Handle navigation away - cancel requests
  const handleBackToLogin = (e?: React.MouseEvent) => {
    e?.preventDefault();
    cleanup();
    router.push("/login");
  };

  // Handle step change (going back)
  const handleStepChange = (newStep: Step) => {
    cleanup(); // Cancel any ongoing requests
    setStep(newStep);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 px-4">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-xl">
        {/* Back to Login Link */}
        <button
          onClick={handleBackToLogin}
          className="inline-flex items-center text-sm text-slate-300 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Login
        </button>

        {/* Header */}
        <h1 className="text-3xl font-bold text-center text-white mb-2">
          Reset Password
        </h1>
        <p className="text-center text-slate-300 mb-8 text-sm">
          {step === "email" && "Enter your email to receive OTP"}
          {step === "otp" && "Enter the 6-digit OTP sent to your email"}
          {step === "newPassword" && "Enter your new password"}
        </p>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-2">
            {/* Step 1 */}
            <div className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  step === "email"
                    ? "bg-indigo-500 text-white"
                    : step === "otp" || step === "newPassword"
                    ? "bg-green-500 text-white"
                    : "bg-slate-700 text-slate-400"
                }`}
              >
                {step === "otp" || step === "newPassword" ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  "1"
                )}
              </div>
              <div
                className={`h-1 w-12 ${
                  step === "otp" || step === "newPassword"
                    ? "bg-green-500"
                    : "bg-slate-700"
                }`}
              />
            </div>

            {/* Step 2 */}
            <div className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  step === "otp"
                    ? "bg-indigo-500 text-white"
                    : step === "newPassword"
                    ? "bg-green-500 text-white"
                    : "bg-slate-700 text-slate-400"
                }`}
              >
                {step === "newPassword" ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  "2"
                )}
              </div>
              <div
                className={`h-1 w-12 ${
                  step === "newPassword" ? "bg-green-500" : "bg-slate-700"
                }`}
              />
            </div>

            {/* Step 3 */}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                step === "newPassword"
                  ? "bg-indigo-500 text-white"
                  : "bg-slate-700 text-slate-400"
              }`}
            >
              3
            </div>
          </div>
        </div>

        {/* Step 1: Email Input */}
        {step === "email" && (
          <form onSubmit={handleRequestOTP} className="space-y-5">
            <div className="space-y-1">
              <label className="text-sm text-slate-200">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value.toLowerCase())}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-slate-600 bg-slate-900/60 px-3 py-2 text-sm text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !email}
              className="w-full mt-2 rounded-lg bg-indigo-500 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-600 transition disabled:bg-slate-600 disabled:cursor-not-allowed"
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </form>
        )}

        {/* Step 2: OTP Input */}
        {step === "otp" && (
          <form onSubmit={handleVerifyOTP} className="space-y-5">
            <div className="space-y-1">
              <label className="text-sm text-slate-200">OTP Code</label>
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={handleOtpChange}
                placeholder="000000"
                className="w-full rounded-lg border border-slate-600 bg-slate-900/60 px-3 py-2.5 text-center text-lg tracking-wide text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-xs text-slate-400 mt-1">
                Enter the 6-digit code sent to {email}
              </p>
            </div>
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full mt-2 rounded-lg bg-indigo-500 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-600 transition disabled:bg-slate-600 disabled:cursor-not-allowed"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => handleStepChange("email")}
                className="text-slate-400 hover:text-slate-200 transition-colors"
              >
                Change Email
              </button>
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={otpResendTimer > 0 || loading}
                className="text-indigo-400 hover:text-indigo-300 transition-colors disabled:text-slate-600 disabled:cursor-not-allowed"
              >
                {otpResendTimer > 0
                  ? `Resend OTP in ${otpResendTimer}s`
                  : "Resend OTP"}
              </button>
            </div>
          </form>
        )}

        {/* Step 3: New Password */}
        {step === "newPassword" && (
          <form onSubmit={handleResetPassword} className="space-y-5">
            <div className="space-y-1 relative">
              <label className="text-sm text-slate-200">New Password</label>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-slate-600 bg-slate-900/60 px-3 py-2 pr-10 text-sm text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[53%] cursor-pointer text-slate-400 hover:text-slate-200 transition-colors focus:outline-none"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <div className="space-y-1 relative">
              <label className="text-sm text-slate-200">Confirm Password</label>
              <input
                type={showConfirmPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-slate-600 bg-slate-900/60 px-3 py-2 pr-10 text-sm text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-[53%] cursor-pointer text-slate-400 hover:text-slate-200 transition-colors focus:outline-none"
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {newPassword &&
              confirmPassword &&
              newPassword !== confirmPassword && (
                <p className="text-xs text-red-400">Passwords do not match</p>
              )}

            <button
              type="submit"
              disabled={
                loading ||
                !newPassword ||
                !confirmPassword ||
                newPassword !== confirmPassword ||
                newPassword.length < 6
              }
              className="w-full mt-2 rounded-lg bg-indigo-500 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-600 transition disabled:bg-slate-600 disabled:cursor-not-allowed"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-slate-300 mt-6">
          Remember your password?{" "}
          <Link
            href="/login"
            onClick={handleBackToLogin}
            className="font-semibold text-indigo-400 hover:text-indigo-300"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}