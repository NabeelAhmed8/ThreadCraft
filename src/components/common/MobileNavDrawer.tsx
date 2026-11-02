"use client";

import React from "react";
import Link from "next/link";
import {
  X,
  Search,
  ChevronRight,
  ShoppingBag,
  Compass,
  Package,
  ShieldCheck,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";

export interface NavLinkItem {
  label: string;
  href: string;
  badge?: string;
}

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  navLinks: NavLinkItem[];
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  isClient: boolean;
}

/**
 * MobileNavDrawer Component
 * Single Responsibility: Presentational and interactive slide-over drawer for mobile navigation.
 */
export function MobileNavDrawer({
  isOpen,
  onClose,
  navLinks,
  searchQuery,
  setSearchQuery,
  onSearchSubmit,
  isClient,
}: MobileNavDrawerProps) {
  const { totalItems, openCart } = useCart();
  const { user } = useAuth();

  // Freeze background page scroll when drawer is open
  useLockBodyScroll(isOpen);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide panel */}
      <div className="fixed inset-y-0 left-0 w-[85vw] max-w-sm bg-white h-full flex flex-col justify-between shadow-2xl z-10 overflow-y-auto animate-in slide-in-from-left duration-200">
        <div>
          {/* Drawer Top Header */}
          <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
            <Link
              href="/"
              onClick={onClose}
              className="flex flex-col"
            >
              <span className="font-serif text-lg font-bold tracking-tight text-neutral-950">
                THREADCRAFT
              </span>
              <span className="text-[8px] tracking-[0.25em] text-neutral-400 uppercase font-mono">
                STUDIO
              </span>
            </Link>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-black rounded-lg hover:bg-neutral-100 transition"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>

          {/* Mobile In-Drawer Search Input */}
          <div className="p-4 border-b border-neutral-100">
            <form
              id="mobile-search-form"
              name="mobileSearchForm"
              onSubmit={onSearchSubmit}
              className="relative"
            >
              <label htmlFor="mobile-nav-search" className="sr-only">
                Search collections
              </label>
              <input
                id="mobile-nav-search"
                name="search"
                type="search"
                autoComplete="off"
                placeholder="Search collections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg py-2.5 pl-9 pr-4 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
              />
              <Search size={15} className="absolute left-3 top-3 text-neutral-400" />
            </form>
          </div>

          {/* Main Categories Navigation */}
          <div className="p-4 space-y-1">
            <div className="text-[10px] uppercase font-mono tracking-widest text-neutral-400 px-3 py-1">
              Collections
            </div>

            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className="flex items-center justify-between px-3 py-3 rounded-lg text-sm font-medium text-neutral-800 hover:text-black hover:bg-neutral-50 transition"
              >
                <span>{link.label}</span>
                <ChevronRight size={14} className="text-neutral-400" />
              </Link>
            ))}
          </div>

          {/* Quick Customer Links */}
          <div className="px-4 py-2 border-t border-neutral-100 space-y-1">
            <div className="text-[10px] uppercase font-mono tracking-widest text-neutral-400 px-3 py-1">
              Customer Care
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                openCart();
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium text-neutral-700 hover:text-black hover:bg-neutral-50 transition"
            >
              <div className="flex items-center gap-2.5">
                <ShoppingBag size={15} />
                <span>View Shopping Bag</span>
              </div>
              {isClient && totalItems > 0 && (
                <span className="bg-black text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {totalItems}
                </span>
              )}
            </button>

            <Link
              href="/shop"
              onClick={onClose}
              className="flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium text-neutral-700 hover:text-black hover:bg-neutral-50 transition"
            >
              <div className="flex items-center gap-2.5">
                <Compass size={15} />
                <span>Discover Studio Catalog</span>
              </div>
            </Link>

            {isClient && user && (
              <Link
                href="/profile"
                onClick={onClose}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium text-neutral-700 hover:text-black hover:bg-neutral-50 transition"
              >
                <div className="flex items-center gap-2.5">
                  <Package size={15} />
                  <span>Track Wardrobe Orders</span>
                </div>
              </Link>
            )}
          </div>
        </div>

        {/* Drawer Bottom: User Account Card */}
        <div className="p-4 border-t border-neutral-200 bg-neutral-50/70">
          {isClient && user ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-neutral-950 text-white flex items-center justify-center font-serif text-sm font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-neutral-950 leading-tight">
                      {user.name}
                    </h4>
                    <span className="text-[10px] text-neutral-500 font-mono flex items-center gap-1">
                      <ShieldCheck size={11} className="text-emerald-600" />
                      Verified Wardrobe
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-1">
                <Link
                  href="/profile"
                  onClick={onClose}
                  className="block w-full text-center py-2.5 bg-neutral-900 text-white text-xs font-medium uppercase tracking-wider rounded-lg hover:bg-neutral-800 transition"
                >
                  My Profile
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-xs text-neutral-600 text-center mb-1">
                Join our conscious clothing community
              </div>
              <Link
                href="/login"
                onClick={onClose}
                className="block w-full text-center py-2.5 bg-neutral-950 text-white text-xs font-semibold uppercase tracking-wider rounded-lg hover:bg-neutral-800 transition"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                onClick={onClose}
                className="block w-full text-center py-2.5 border border-neutral-300 text-neutral-900 text-xs font-semibold uppercase tracking-wider rounded-lg hover:bg-white transition"
              >
                Create Account
              </Link>
            </div>
          )}

          {/* Legal & Shipping note */}
          <div className="pt-3 text-[10px] text-neutral-400 text-center tracking-wider">
            &copy; 2026 THREADCRAFT STUDIO
          </div>
        </div>
      </div>
    </div>
  );
}

