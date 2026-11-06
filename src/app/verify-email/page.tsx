"use client";

import React, { useState, useEffect, Suspense, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Mail, ArrowRight, RefreshCw, KeyRound, ArrowLeft } from "lucide-react";
import { AuthAlert } from "@/components/auth/AuthAlert";

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const initialEmail = searchParams.get("email") || "";
  const initialCode = searchParams.get("code") || "";
  const targetRedirect = searchParams.get("redirect") || "/profile";

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
          router.push(targetRedirect);
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
    [login, router, targetRedirect]
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
    <div className="relative min-h-screen flex items-center justify-center p-4 sm:p-6 bg-neutral-50/50">
      {/* Bottom Left Corner: Back to Home Button */}
      <Link
        href="/"
        className="fixed bottom-5 left-5 z-20 flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-950 bg-white/90 hover:bg-white backdrop-blur-md border border-neutral-200/90 rounded-full shadow-xs transition duration-150 group"
        title="Return to Home"
        aria-label="Back to Home"
      >
        <ArrowLeft
          size={14}
          className="text-neutral-500 group-hover:text-neutral-900 group-hover:-translate-x-0.5 transition-transform"
        />
        <span>Back to Home</span>
      </Link>

      <div className="max-w-md w-full space-y-3.5 sm:space-y-4 bg-white p-5 sm:p-6 border border-neutral-200 rounded-2xl shadow-xs">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 bg-neutral-100 rounded-full mb-2 text-neutral-900">
            <KeyRound size={20} />
          </div>
          <h1 className="font-serif text-xl sm:text-2xl font-semibold text-neutral-900">
            Verify Your Email
          </h1>
          <p className="text-xs text-neutral-500 mt-1 max-w-xs mx-auto">
            We sent a 6-digit verification code to your email. Enter it below or
            click the button inside your email.
          </p>
        </div>

        {/* Notifications */}
        <AuthAlert type="error" message={error} />
        <AuthAlert type="success" message={success} />

        {/* Form */}
        <form id="verify-email-form" name="verifyEmailForm" onSubmit={handleSubmit} className="space-y-3.5">
          {/* Email input */}
          <div>
            <label htmlFor="verify-email-input" className="block text-xs font-medium text-neutral-700 uppercase tracking-wider mb-1 cursor-pointer">
              Email Address
            </label>
            <div className="relative">
              <input
                id="verify-email-input"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-white border border-neutral-300 rounded-lg py-2.5 pl-9 pr-3 text-xs sm:text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition"
              />
              <Mail size={15} className="absolute left-3 top-3 text-neutral-400" />
            </div>
          </div>

          {/* 6-Digit Code */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="verify-code-input" className="block text-xs font-medium text-neutral-700 uppercase tracking-wider cursor-pointer">
                6-Digit Verification Code
              </label>
              <button
                type="button"
                onClick={handleResend}
                disabled={resending || countdown > 0}
                className="text-xs text-neutral-500 hover:text-black disabled:text-neutral-300 flex items-center gap-1 transition"
              >
                <RefreshCw size={11} className={resending ? "animate-spin" : ""} />
                <span>
                  {countdown > 0 ? `Resend in ${countdown}s` : "Resend Code"}
                </span>
              </button>
            </div>
            <div className="relative">
              <input
                id="verify-code-input"
                name="verificationCode"
                type="text"
                autoComplete="one-time-code"
                required
                maxLength={6}
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))
                }
                placeholder="123456"
                className="w-full tracking-[0.35em] font-mono text-center font-bold text-base sm:text-lg bg-neutral-50 border border-neutral-300 rounded-lg py-2 px-3 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition"
              />
            </div>
            <p className="text-[11px] text-neutral-400 mt-1 text-center">
              Check your inbox or spam folder for the Nodemailer email.
            </p>
          </div>

          {/* Submit button */}
          <button
            id="verify-submit-btn"
            name="verifySubmit"
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full flex items-center justify-center gap-2 bg-neutral-950 text-white text-xs uppercase tracking-widest font-semibold py-2.5 sm:py-3 rounded-lg hover:bg-neutral-800 disabled:bg-neutral-300 disabled:cursor-not-allowed transition shadow-xs"
          >
            <span>{loading ? "Verifying..." : "Confirm & Sign In"}</span>
            {!loading && <ArrowRight size={14} />}
          </button>
        </form>

        {/* Footer Link */}
        <div className="border-t border-neutral-100 pt-3 text-center">
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
