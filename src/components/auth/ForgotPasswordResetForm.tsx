"use client";

import React, { useState } from "react";
import { Lock, Eye, EyeOff, RefreshCw, ArrowRight } from "lucide-react";

interface ForgotPasswordResetFormProps {
  email: string;
  code: string;
  setCode: (value: string) => void;
  newPassword: string;
  setNewPassword: (value: string) => void;
  confirmPassword: string;
  setConfirmPassword: (value: string) => void;
  loading: boolean;
  resending: boolean;
  countdown: number;
  onResend: () => void;
  onChangeEmail: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

/**
 * ForgotPasswordResetForm
 * Single Responsibility: Presentational input controls for OTP verification and setting a new password.
 */
export function ForgotPasswordResetForm({
  email,
  code,
  setCode,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  loading,
  resending,
  countdown,
  onResend,
  onChangeEmail,
  onSubmit,
}: ForgotPasswordResetFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form id="forgot-password-reset-form" onSubmit={onSubmit} className="space-y-4">
      {/* Target account info */}
      <div className="flex items-center justify-between bg-neutral-50 px-3.5 py-2.5 rounded-lg border border-neutral-200">
        <div className="text-xs text-neutral-600 truncate mr-2">
          Code sent to: <span className="font-semibold text-neutral-900">{email}</span>
        </div>
        <button
          type="button"
          onClick={onChangeEmail}
          className="text-xs text-neutral-500 hover:text-black underline shrink-0"
        >
          Change
        </button>
      </div>

      {/* 6-Digit Code */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <label
            htmlFor="reset-code-input"
            className="block text-xs font-medium text-neutral-700 uppercase tracking-wider cursor-pointer"
          >
            6-Digit Verification Code
          </label>
          <button
            type="button"
            onClick={onResend}
            disabled={resending || countdown > 0}
            className="text-xs text-neutral-500 hover:text-black disabled:text-neutral-300 flex items-center gap-1 transition"
          >
            <RefreshCw size={12} className={resending ? "animate-spin" : ""} />
            <span>{countdown > 0 ? `Resend in ${countdown}s` : "Resend Code"}</span>
          </button>
        </div>
        <input
          id="reset-code-input"
          name="code"
          type="text"
          autoComplete="one-time-code"
          required
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
          placeholder="123456"
          className="w-full tracking-[0.35em] font-mono text-center font-bold text-lg bg-neutral-50 border border-neutral-300 rounded-lg py-2.5 px-4 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition"
        />
      </div>

      {/* New Password */}
      <div>
        <label
          htmlFor="new-password-input"
          className="block text-xs font-medium text-neutral-700 uppercase tracking-wider mb-1.5 cursor-pointer"
        >
          New Password
        </label>
        <div className="relative">
          <input
            id="new-password-input"
            name="newPassword"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            minLength={6}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="At least 6 characters"
            className="w-full bg-white border border-neutral-300 rounded-lg py-3 pl-10 pr-10 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition"
          />
          <Lock size={16} className="absolute left-3.5 top-3.5 text-neutral-400" />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3.5 top-3.5 text-neutral-400 hover:text-neutral-700"
            aria-label="Toggle password visibility"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {/* Confirm Password */}
      <div>
        <label
          htmlFor="confirm-password-input"
          className="block text-xs font-medium text-neutral-700 uppercase tracking-wider mb-1.5 cursor-pointer"
        >
          Confirm New Password
        </label>
        <div className="relative">
          <input
            id="confirm-password-input"
            name="confirmPassword"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            minLength={6}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter your password"
            className="w-full bg-white border border-neutral-300 rounded-lg py-3 pl-10 pr-4 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition"
          />
          <Lock size={16} className="absolute left-3.5 top-3.5 text-neutral-400" />
        </div>
      </div>

      {/* Submit Button */}
      <button
        id="reset-submit-btn"
        type="submit"
        disabled={loading || code.length !== 6}
        className="w-full flex items-center justify-center gap-2 bg-neutral-950 text-white text-xs uppercase tracking-widest font-semibold py-3.5 rounded-lg hover:bg-neutral-800 disabled:bg-neutral-300 disabled:cursor-not-allowed transition mt-2 shadow-xs"
      >
        <span>{loading ? "Resetting Password..." : "Update Password"}</span>
        {!loading && <ArrowRight size={15} />}
      </button>
    </form>
  );
}

