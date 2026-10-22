"use client";

import React, { useState, useEffect, Suspense, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Mail, CheckCircle2, AlertCircle, ArrowRight, RefreshCw, KeyRound } from "lucide-react";

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const initialEmail = searchParams.get("email") || "";
  const initialCode = searchParams.get("code") || "";

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  // Verification submit logic
  const handleVerify = useCallback(
    async (emailToVerify: string, codeToVerify: string) => {
      if (!emailToVerify.trim() || !codeToVerify.trim()) {
        setError("Please provide both email and the 6-digit verification code.");
        return;
      }

      setLoading(true);
      setError(null);
      setSuccess(null);

      try {
        const res = await fetch("/api/auth/verify-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: emailToVerify.trim(),
            code: codeToVerify.trim(),
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Verification failed. Please try again.");
        }

        setSuccess(data.message || "Email verified successfully! Redirecting...");
        login(data.user);

        setTimeout(() => {
          router.push("/shop");
        }, 1200);
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? err.message
            : "Verification failed. Please check the code."
        );
      } finally {
        setLoading(false);
      }
    },
    [login, router]
  );

  // Automatically verify when user clicks direct button inside email link
  useEffect(() => {
    if (initialEmail && initialCode) {
      let isCancelled = false;
      const runAutoVerify = async () => {
        if (!isCancelled) {
          await handleVerify(initialEmail, initialCode);
        }
      };
      runAutoVerify();
      return () => {
        isCancelled = true;
      };
    }
  }, [initialEmail, initialCode, handleVerify]);

  // Resend countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleVerify(email, code);
  };

  const handleResend = async () => {
    if (!email.trim()) {
      setError("Please enter your email to resend the code.");
      return;
    }

    setResending(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/resend-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to resend verification code.");
      }

      setSuccess("A fresh 6-digit code has been sent to your email!");
      setCountdown(60); // 60s cooldown
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Error resending verification code."
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8 bg-neutral-50/50">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 border border-neutral-200 rounded-2xl shadow-xs">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-neutral-100 rounded-full mb-3 text-neutral-900">
            <KeyRound size={22} />
          </div>
          <h1 className="font-serif text-2xl font-semibold text-neutral-900">
            Verify Your Email
          </h1>
          <p className="text-xs text-neutral-500 mt-1 max-w-xs mx-auto">
            We sent a 6-digit verification code to your email. Enter it below or
            click the button inside your email.
          </p>
        </div>

        {/* Error / Success Notifications */}
        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2.5 text-red-700 text-xs">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3.5 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2.5 text-green-700 text-xs">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email input */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-white border border-neutral-300 rounded-lg py-3 pl-10 pr-4 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition"
              />
              <Mail size={16} className="absolute left-3.5 top-3.5 text-neutral-400" />
            </div>
          </div>

          {/* 6-Digit Code */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-medium text-neutral-700 uppercase tracking-wider">
                6-Digit Verification Code
              </label>
              <button
                type="button"
                onClick={handleResend}
                disabled={resending || countdown > 0}
                className="text-xs text-neutral-500 hover:text-black disabled:text-neutral-300 flex items-center gap-1 transition"
              >
                <RefreshCw size={12} className={resending ? "animate-spin" : ""} />
                <span>
                  {countdown > 0 ? `Resend in ${countdown}s` : "Resend Code"}
                </span>
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                required
                maxLength={6}
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))
                }
                placeholder="123456"
                className="w-full tracking-[0.4em] font-mono text-center font-bold text-lg bg-neutral-50 border border-neutral-300 rounded-lg py-3 px-4 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition"
              />
            </div>
            <p className="text-[11px] text-neutral-400 mt-1.5 text-center">
              Check your inbox or spam folder for the Nodemailer email.
            </p>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full flex items-center justify-center gap-2 bg-neutral-950 text-white text-xs uppercase tracking-widest font-semibold py-3.5 rounded-lg hover:bg-neutral-800 disabled:bg-neutral-300 disabled:cursor-not-allowed transition mt-2 shadow-xs"
          >
            <span>{loading ? "Verifying..." : "Confirm & Sign In"}</span>
            {!loading && <ArrowRight size={15} />}
          </button>
        </form>

        {/* Footer Link */}
        <div className="border-t border-neutral-100 pt-6 text-center">
          <Link
            href="/login"
            className="text-xs text-neutral-500 hover:text-neutral-900 transition"
          >
            &larr; Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center text-sm text-neutral-500 font-mono">
          Loading verification portal...
        </div>
      }
    >
      <VerifyEmailForm />
    </Suspense>
  );
}
