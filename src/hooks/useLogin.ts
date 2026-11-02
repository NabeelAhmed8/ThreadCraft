"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

/**
 * useLogin Hook
 * Single Responsibility: Manage login state, API communication, and redirect routing.
 */
export function useLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  // Redirect destination defaults to profile page
  const targetRedirect = searchParams.get("redirect") || "/profile";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError("Please fill in both email and password.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Invalid credentials.");
      }

      // If multi-factor verification is required, forward user to verify-email with redirect query
      if (data.requireVerification) {
        setSuccess("Verification code sent to your email! Redirecting...");
        setTimeout(() => {
          router.push(
            `/verify-email?email=${encodeURIComponent(trimmedEmail)}&redirect=${encodeURIComponent(targetRedirect)}`
          );
        }, 800);
        return;
      }

      // Direct login: save user context and redirect to profile
      setSuccess("Logged in successfully! Redirecting...");
      login(data.user);

      setTimeout(() => {
        router.push(targetRedirect);
      }, 1000);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    loading,
    error,
    success,
    handleSubmit,
  };
}

