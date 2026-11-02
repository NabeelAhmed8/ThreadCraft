"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { AuthAlert } from "@/components/auth/AuthAlert";
import { ForgotPasswordRequestForm } from "@/components/auth/ForgotPasswordRequestForm";
import { ForgotPasswordResetForm } from "@/components/auth/ForgotPasswordResetForm";
import { useForgotPassword } from "@/hooks/useForgotPassword";

function ForgotPasswordCard() {
  const {
    step,
    identifier,
    setIdentifier,
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
    error,
    success,
    handleRequestCode,
    handleResendCode,
    handleResetPassword,
    handleChangeEmail,
  } = useForgotPassword();

  return (
    <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 border border-neutral-200 rounded-2xl shadow-xs">
      <AuthHeader
        title={step === 1 ? "Reset Password" : "Set New Password"}
        subtitle={
          step === 1
            ? "Enter your email or phone to receive a 6-digit verification code."
            : "Enter the verification code and choose your new password."
        }
      />

      <AuthAlert type="error" message={error} />
      <AuthAlert type="success" message={success} />

      {step === 1 ? (
        <ForgotPasswordRequestForm
          identifier={identifier}
          setIdentifier={setIdentifier}
          loading={loading}
          onSubmit={handleRequestCode}
        />
      ) : (
        <ForgotPasswordResetForm
          email={email}
          code={code}
          setCode={setCode}
          newPassword={newPassword}
          setNewPassword={setNewPassword}
          confirmPassword={confirmPassword}
          setConfirmPassword={setConfirmPassword}
          loading={loading}
          resending={resending}
          countdown={countdown}
          onResend={handleResendCode}
          onChangeEmail={handleChangeEmail}
          onSubmit={handleResetPassword}
        />
      )}

      <div className="border-t border-neutral-100 pt-6 text-center">
        <Link
          href="/login"
          className="text-xs text-neutral-500 hover:text-neutral-900 transition"
        >
          &larr; Back to Sign In
        </Link>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8 bg-neutral-50/50">
      <Suspense
        fallback={
          <div className="text-xs text-neutral-400 font-mono">
            Loading reset portal...
          </div>
        }
      >
        <ForgotPasswordCard />
      </Suspense>
    </div>
  );
}

