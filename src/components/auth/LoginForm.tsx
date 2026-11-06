"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";

interface LoginFormProps {
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

/**
 * LoginForm Component
 * Single Responsibility: Presentational form inputs & controls for user login.
 */
export function LoginForm({
  email,
  setEmail,
  password,
  setPassword,
  loading,
  onSubmit,
}: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form id="login-form" name="loginForm" onSubmit={onSubmit} className="space-y-3.5">
      {/* Email input */}
      <div>
        <label
          htmlFor="login-email"
          className="block text-xs font-medium text-neutral-700 uppercase tracking-wider mb-1 cursor-pointer"
        >
          Email Address
        </label>
        <div className="relative">
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            className="w-full bg-white border border-neutral-300 rounded-lg py-2.5 pl-10 pr-4 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition"
          />
          <Mail size={16} className="absolute left-3.5 top-3 text-neutral-400" />
        </div>
      </div>

      {/* Password input */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <label
            htmlFor="login-password"
            className="block text-xs font-medium text-neutral-700 uppercase tracking-wider cursor-pointer"
          >
            Password
          </label>
          <Link
            href="/forgot-password"
            className="text-xs text-neutral-400 hover:text-black transition"
          >
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <input
            id="login-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full bg-white border border-neutral-300 rounded-lg py-2.5 pl-10 pr-10 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition"
          />
          <Lock size={16} className="absolute left-3.5 top-3 text-neutral-400" />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3.5 top-3 text-neutral-400 hover:text-neutral-700"
            aria-label="Toggle password visibility"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {/* Submit button */}
      <button
        id="login-submit-btn"
        name="loginSubmit"
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-neutral-950 text-white text-xs uppercase tracking-widest font-semibold py-3 rounded-lg hover:bg-neutral-800 disabled:bg-neutral-400 transition mt-1 shadow-xs"
      >
        <span>{loading ? "Signing In..." : "Sign In"}</span>
        {!loading && <ArrowRight size={15} />}
      </button>
    </form>
  );
}
