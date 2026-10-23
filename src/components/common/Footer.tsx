"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to subscribe. Please try again.");
      }

      setFeedback({ type: "success", message: data.message });
      setEmail("");
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Something went wrong.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="bg-neutral-950 text-neutral-300 border-t border-neutral-900 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand Manifesto */}
          <div className="md:col-span-1 space-y-4">
            <span className="font-serif text-2xl font-bold tracking-tight text-white block">
              THREADCRAFT
            </span>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Modern silhouettes, enduring tailoring, and conscious essentials
              designed for effortless daily living.
            </p>
          </div>

          {/* Shop Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white">
              Collection
            </h4>
            <ul className="space-y-2 text-sm text-neutral-400">
              <li>
                <Link href="/shop" className="hover:text-white transition">
                  All Essentials
                </Link>
              </li>
              <li>
                <Link href="/shop?category=men" className="hover:text-white transition">
                  Men&apos;s Edition
                </Link>
              </li>
              <li>
                <Link href="/shop?category=women" className="hover:text-white transition">
                  Women&apos;s Edition
                </Link>
              </li>
              <li>
                <Link href="/shop?category=outerwear" className="hover:text-white transition">
                  Outerwear &amp; Knits
                </Link>
              </li>
            </ul>
          </div>

          {/* Support / Help */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white">
              Care &amp; Client Service
            </h4>
            <ul className="space-y-2 text-sm text-neutral-400">
              <li>
                <Link href="/cart" className="hover:text-white transition">
                  View Bag
                </Link>
              </li>
              <li>
                <span className="text-neutral-500">Shipping &amp; Duties</span>
              </li>
              <li>
                <span className="text-neutral-500">30-Day Returns</span>
              </li>
              <li>
                <span className="text-neutral-500">Sizing Guide</span>
              </li>
            </ul>
          </div>

          {/* Newsletter / Join Club */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white">
              Stay in the Circle
            </h4>
            <p className="text-xs text-neutral-400">
              Be first to receive capsule releases, archival restocks, and private studio sales.
            </p>

            <form id="footer-newsletter-form" name="newsletterForm" onSubmit={handleSubscribe} className="space-y-2">
              <label htmlFor="footer-newsletter-email" className="sr-only">
                Email address for newsletter
              </label>
              <input
                id="footer-newsletter-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                disabled={loading}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (feedback) setFeedback(null);
                }}
                placeholder="Enter your email"
                className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-400 transition disabled:opacity-50"
              />
              <button
                id="footer-newsletter-submit"
                name="newsletterSubmit"
                type="submit"
                disabled={loading}
                className="w-full bg-white text-black text-xs font-semibold uppercase tracking-wider py-2.5 rounded hover:bg-neutral-200 transition disabled:bg-neutral-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Subscribing...</span>
                  </>
                ) : (
                  <span>Subscribe</span>
                )}
              </button>
            </form>

            {feedback && (
              <div
                className={`p-2.5 rounded text-xs flex items-start gap-2 ${
                  feedback.type === "success"
                    ? "bg-emerald-950/60 border border-emerald-800/80 text-emerald-300"
                    : "bg-red-950/60 border border-red-800/80 text-red-300"
                }`}
              >
                {feedback.type === "success" ? (
                  <CheckCircle2 size={15} className="shrink-0 mt-0.5 text-emerald-400" />
                ) : (
                  <AlertCircle size={15} className="shrink-0 mt-0.5 text-red-400" />
                )}
                <span className="leading-snug">{feedback.message}</span>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-neutral-900 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500">
          <p>&copy; 2026 ThreadCraft Studio Inc. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 sm:mt-0">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Cookie Preferences</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
