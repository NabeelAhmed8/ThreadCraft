"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Eye, EyeOff, Lock, Mail, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email.trim() || !password) {
      setError("Please fill in both email and password.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Invalid credentials.");
      }

      if (data.requireVerification) {
        setSuccess("Verification code sent to your email! Redirecting...");
        setTimeout(() => {
          router.push(`/verify-email?email=${encodeURIComponent(email.trim())}`);
        }, 800);
        return;
      }

      setSuccess("Logged in successfully! Redirecting...");
      login(data.user);

      setTimeout(() => {
        router.push("/shop");
      }, 1000);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8 bg-neutral-50/50">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 border border-neutral-200 rounded-2xl shadow-xs">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="inline-block group mb-3">
            <span className="font-serif text-2xl font-bold tracking-tight text-neutral-950 block">
              THREADCRAFT
            </span>
            <span className="text-[10px] tracking-[0.28em] text-neutral-400 uppercase font-mono">
              STUDIO &bull; ACCOUNT
            </span>
          </Link>
          <h1 className="font-serif text-2xl font-semibold text-neutral-900 mt-2">
            Welcome Back
          </h1>
          <p className="text-xs text-neutral-500 mt-1 max-w-xs mx-auto">
            Sign in to access your wardrobe orders and checkout effortlessly.
          </p>
        </div>

        {/* Error / Success Notifications */}
        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2.5 text-red-700 text-xs">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3.5 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2.5 text-green-700 text-xs">
            <CheckCircle2 size={16} className="flex-shrink-0" />
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

          {/* Password input */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-medium text-neutral-700 uppercase tracking-wider">
                Password
              </label>
              <span className="text-xs text-neutral-400 hover:text-black cursor-pointer">
                Forgot password?
              </span>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white border border-neutral-300 rounded-lg py-3 pl-10 pr-10 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition"
              />
              <Lock size={16} className="absolute left-3.5 top-3.5 text-neutral-400" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-neutral-400 hover:text-neutral-700"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-neutral-950 text-white text-xs uppercase tracking-widest font-semibold py-3.5 rounded-lg hover:bg-neutral-800 disabled:bg-neutral-400 transition mt-2 shadow-xs"
          >
            <span>{loading ? "Signing In..." : "Sign In"}</span>
            {!loading && <ArrowRight size={15} />}
          </button>
        </form>

        {/* Footer */}
        <div className="border-t border-neutral-100 pt-6 text-center">
          <p className="text-xs text-neutral-500">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="text-neutral-950 font-semibold hover:underline"
            >
              Create an Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
