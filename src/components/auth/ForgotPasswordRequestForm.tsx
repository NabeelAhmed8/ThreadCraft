"use client";

import React from "react";
import { Mail, ArrowRight } from "lucide-react";

interface ForgotPasswordRequestFormProps {
  identifier: string;
  setIdentifier: (value: string) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

/**
 * ForgotPasswordRequestForm
 * Single Responsibility: Presentational input for requesting a password reset OTP.
 */
export function ForgotPasswordRequestForm({
  identifier,
  setIdentifier,
  loading,
  onSubmit,
}: ForgotPasswordRequestFormProps) {
  return (
    <form id="forgot-password-request-form" onSubmit={onSubmit} className="space-y-5">
      <div>
        <label
          htmlFor="reset-identifier"
          className="block text-xs font-medium text-neutral-700 uppercase tracking-wider mb-1.5 cursor-pointer"
        >
          Email Address or Phone
        </label>
        <div className="relative">
          <input
            id="reset-identifier"
            name="identifier"
            type="text"
            required
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="name@example.com or phone"
            className="w-full bg-white border border-neutral-300 rounded-lg py-3 pl-10 pr-4 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition"
          />
          <Mail size={16} className="absolute left-3.5 top-3.5 text-neutral-400" />
        </div>
        <p className="text-[11px] text-neutral-400 mt-1.5">
          Enter the email address or phone linked to your ThreadCraft account.
        </p>
      </div>

      <button
        id="send-reset-code-btn"
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-neutral-950 text-white text-xs uppercase tracking-widest font-semibold py-3.5 rounded-lg hover:bg-neutral-800 disabled:bg-neutral-400 transition shadow-xs"
      >
        <span>{loading ? "Sending Code..." : "Send Verification Code"}</span>
        {!loading && <ArrowRight size={15} />}
      </button>
    </form>
  );
}

