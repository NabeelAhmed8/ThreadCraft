"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Eye, EyeOff, Lock, Mail, User, Phone, ArrowRight } from "lucide-react";
import { AuthAlert } from "@/components/auth/AuthAlert";

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim() || !email.trim() || !password) {
      setError("Please fill in all required fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please verify.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create account.");
      }

      if (data.requireVerification) {
        setSuccess("Account created! Verification code sent to your email. Redirecting...");
        setTimeout(() => {
          router.push(`/verify-email?email=${encodeURIComponent(email.trim())}&redirect=/profile`);
        }, 800);
        return;
      }

      setSuccess("Account created successfully! Welcome to ThreadCraft.");
      login(data.user);

      setTimeout(() => {
        router.push("/profile");
      }, 1200);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8 bg-neutral-50/50">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 border border-neutral-200 rounded-2xl shadow-xs">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="inline-block group mb-3">
            <span className="font-serif text-2xl font-bold tracking-tight text-neutral-950 block">
              THREADCRAFT
            </span>
            <span className="text-[10px] tracking-[0.28em] text-neutral-400 uppercase font-mono">
              STUDIO &bull; JOIN
            </span>
          </Link>
          <h1 className="font-serif text-2xl font-semibold text-neutral-900 mt-2">
            Create an Account
          </h1>
          <p className="text-xs text-neutral-500 mt-1 max-w-xs mx-auto">
            Become a part of the ThreadCraft community for order tracking and exclusive releases.
          </p>
        </div>

        {/* Notifications */}
        <AuthAlert type="error" message={error} />
        <AuthAlert type="success" message={success} />

        {/* Form */}
        <form id="register-form" name="registerForm" onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label htmlFor="register-name" className="block text-xs font-medium text-neutral-700 uppercase tracking-wider mb-1.5 cursor-pointer">
              Full Name *
            </label>
            <div className="relative">
              <input
                id="register-name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ahmed Khan"
                className="w-full bg-white border border-neutral-300 rounded-lg py-3 pl-10 pr-4 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition"
              />
              <User size={16} className="absolute left-3.5 top-3.5 text-neutral-400" />
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="register-email" className="block text-xs font-medium text-neutral-700 uppercase tracking-wider mb-1.5 cursor-pointer">
              Email Address *
            </label>
            <div className="relative">
              <input
                id="register-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-white border border-neutral-300 rounded-lg py-3 pl-10 pr-4 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition"
              />
              <Mail size={16} className="absolute left-3.5 top-3.5 text-neutral-400" />
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label htmlFor="register-phone" className="block text-xs font-medium text-neutral-700 uppercase tracking-wider mb-1.5 cursor-pointer">
              Phone Number
            </label>
            <div className="relative">
              <input
                id="register-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+92 300 1234567"
                className="w-full bg-white border border-neutral-300 rounded-lg py-3 pl-10 pr-4 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition"
              />
              <Phone size={16} className="absolute left-3.5 top-3.5 text-neutral-400" />
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="register-password" className="block text-xs font-medium text-neutral-700 uppercase tracking-wider mb-1.5 cursor-pointer">
              Password * (Min 6 chars)
            </label>
            <div className="relative">
              <input
                id="register-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
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

          {/* Confirm Password */}
          <div>
            <label htmlFor="register-confirm-password" className="block text-xs font-medium text-neutral-700 uppercase tracking-wider mb-1.5 cursor-pointer">
              Confirm Password *
            </label>
            <div className="relative">
              <input
                id="register-confirm-password"
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white border border-neutral-300 rounded-lg py-3 pl-10 pr-4 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition"
              />
              <Lock size={16} className="absolute left-3.5 top-3.5 text-neutral-400" />
            </div>
          </div>

          {/* Terms checkbox */}
          <div className="flex items-start gap-2 pt-1">
            <input
              type="checkbox"
              required
              id="terms"
              name="terms"
              autoComplete="off"
              className="mt-0.5 h-3.5 w-3.5 rounded border-neutral-300 text-black focus:ring-black"
            />
            <label htmlFor="terms" className="text-[11px] text-neutral-500 leading-snug">
              I agree to ThreadCraft&apos;s Terms of Service and Privacy Policy.
            </label>
          </div>

          {/* Submit button */}
          <button
            id="register-submit-btn"
            name="registerSubmit"
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-neutral-950 text-white text-xs uppercase tracking-widest font-semibold py-3.5 rounded-lg hover:bg-neutral-800 disabled:bg-neutral-400 transition mt-4 shadow-xs"
          >
            <span>{loading ? "Creating Account..." : "Create Account"}</span>
            {!loading && <ArrowRight size={15} />}
          </button>
        </form>

        {/* Footer */}
        <div className="border-t border-neutral-100 pt-6 text-center">
          <p className="text-xs text-neutral-500">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-neutral-950 font-semibold hover:underline"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
