"use client";

import React, { useState } from "react";
import { User, Mail, Phone, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";

interface RegisterFormProps {
  name: string;
  setName: (val: string) => void;
  email: string;
  setEmail: (val: string) => void;
  phone: string;
  setPhone: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  confirmPassword: string;
  setConfirmPassword: (val: string) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

/**
 * RegisterForm Component
 * Single Responsibility: Presentational input controls for user registration with compact layout.
 */
export function RegisterForm({
  name,
  setName,
  email,
  setEmail,
  phone,
  setPhone,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  loading,
  onSubmit,
}: RegisterFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form id="register-form" name="registerForm" onSubmit={onSubmit} className="space-y-3">
      {/* Name */}
      <div>
        <label htmlFor="register-name" className="block text-xs font-medium text-neutral-700 uppercase tracking-wider mb-1 cursor-pointer">
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
            className="w-full bg-white border border-neutral-300 rounded-lg py-2 pl-9 pr-3 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition"
          />
          <User size={15} className="absolute left-3 top-2.5 text-neutral-400" />
        </div>
      </div>

      {/* Grid: Email & Phone side by side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="register-email" className="block text-xs font-medium text-neutral-700 uppercase tracking-wider mb-1 cursor-pointer">
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
              className="w-full bg-white border border-neutral-300 rounded-lg py-2 pl-9 pr-3 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition"
            />
            <Mail size={15} className="absolute left-3 top-2.5 text-neutral-400" />
          </div>
        </div>

        <div>
          <label htmlFor="register-phone" className="block text-xs font-medium text-neutral-700 uppercase tracking-wider mb-1 cursor-pointer">
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
              className="w-full bg-white border border-neutral-300 rounded-lg py-2 pl-9 pr-3 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition"
            />
            <Phone size={15} className="absolute left-3 top-2.5 text-neutral-400" />
          </div>
        </div>
      </div>

      {/* Grid: Password & Confirm Password */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="register-password" className="block text-xs font-medium text-neutral-700 uppercase tracking-wider mb-1 cursor-pointer">
            Password *
          </label>
          <div className="relative">
            <input
              id="register-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 6 chars"
              className="w-full bg-white border border-neutral-300 rounded-lg py-2 pl-9 pr-8 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition"
            />
            <Lock size={15} className="absolute left-3 top-2.5 text-neutral-400" />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-neutral-700"
              aria-label="Toggle password visibility"
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="register-confirm-password" className="block text-xs font-medium text-neutral-700 uppercase tracking-wider mb-1 cursor-pointer">
            Confirm Password *
          </label>
          <div className="relative">
            <input
              id="register-confirm-password"
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              className="w-full bg-white border border-neutral-300 rounded-lg py-2 pl-9 pr-3 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition"
            />
            <Lock size={15} className="absolute left-3 top-2.5 text-neutral-400" />
          </div>
        </div>
      </div>

      {/* Terms checkbox */}
      <div className="flex items-center gap-2 pt-0.5">
        <input
          type="checkbox"
          required
          id="terms"
          name="terms"
          className="h-3.5 w-3.5 rounded border-neutral-300 text-black focus:ring-black"
        />
        <label htmlFor="terms" className="text-[11px] text-neutral-500 leading-none">
          I agree to ThreadCraft&apos;s Terms & Privacy Policy.
        </label>
      </div>

      {/* Submit button */}
      <button
        id="register-submit-btn"
        name="registerSubmit"
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-neutral-950 text-white text-xs uppercase tracking-widest font-semibold py-3 rounded-lg hover:bg-neutral-800 disabled:bg-neutral-400 transition mt-1 shadow-xs"
      >
        <span>{loading ? "Creating Account..." : "Create Account"}</span>
        {!loading && <ArrowRight size={15} />}
      </button>
    </form>
  );
}

