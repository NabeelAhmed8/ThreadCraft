"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { AuthAlert } from "@/components/auth/AuthAlert";
import { LoginForm } from "@/components/auth/LoginForm";
import { useLogin } from "@/hooks/useLogin";

function LoginCard() {
  const {
    email,
    setEmail,
    password,
    setPassword,
    loading,
    error,
    success,
    handleSubmit,
  } = useLogin();

  return (
    <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 border border-neutral-200 rounded-2xl shadow-xs">
      <AuthHeader
        title="Welcome Back"
        subtitle="Sign in to access your wardrobe orders and checkout effortlessly."
      />

      <AuthAlert type="error" message={error} />
      <AuthAlert type="success" message={success} />

      <LoginForm
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        loading={loading}
        onSubmit={handleSubmit}
      />

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
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8 bg-neutral-50/50">
      <Suspense
        fallback={
          <div className="text-xs text-neutral-400 font-mono">
            Loading sign in...
          </div>
        }
      >
        <LoginCard />
      </Suspense>
    </div>
  );
}
