"use client";

import React from "react";
import Link from "next/link";

export default function Footer() {
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
            <div className="text-[11px] text-neutral-500 uppercase tracking-widest pt-2">
              All data dynamically connected to MongoDB.
            </div>
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
            <form onSubmit={(e) => e.preventDefault()} className="space-y-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500"
              />
              <button
                type="submit"
                className="w-full bg-white text-black text-xs font-medium uppercase tracking-wider py-2 rounded hover:bg-neutral-200 transition"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        <div className="border-t border-neutral-900 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500">
          <p>&copy; 2026 ThreadCraft Studio Inc. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 sm:mt-0">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>MongoDB Connected</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
