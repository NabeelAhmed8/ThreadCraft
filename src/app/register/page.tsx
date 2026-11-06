"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { AuthAlert } from "@/components/auth/AuthAlert";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { useRegister } from "@/hooks/useRegister";

function RegisterCard() {
  const {
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
    error,
    success,
    handleSubmit,
  } = useRegister();

  return (
    <div className="max-w-md w-full space-y-4 sm:space-y-5 bg-white p-6 sm:p-7 border border-neutral-200 rounded-2xl shadow-xs">
      <AuthHeader
        title="Create an Account"
        subtitle="Become a part of the ThreadCraft community for order tracking and exclusive releases."
        badge="STUDIO • JOIN"
      />

      <AuthAlert type="error" message={error} />
      <AuthAlert type="success" message={success} />

      <RegisterForm
        name={name}
        setName={setName}
        email={email}
        setEmail={setEmail}
        phone={phone}
        setPhone={setPhone}
        password={password}
        setPassword={setPassword}
        confirmPassword={confirmPassword}
        setConfirmPassword={setConfirmPassword}
        loading={loading}
        onSubmit={handleSubmit}
      />

      <div className="border-t border-neutral-100 pt-3.5 text-center">
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
  );
}

export default function RegisterPage() {
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

      <Suspense
        fallback={
          <div className="text-xs text-neutral-400 font-mono">
            Loading registration portal...
          </div>
        }
      >
        <RegisterCard />
      </Suspense>
    </div>
  );
}
