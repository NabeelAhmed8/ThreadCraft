"use client";

import React, { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingBag, Menu, X, Search } from "lucide-react";
import { useCart } from "@/context/CartContext";

const emptySubscribe = () => () => {};

export default function Navbar() {
  const router = useRouter();
  const { totalItems, openCart } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Hydration-safe client check without setState in effect
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const navLinks = [
    { label: "Shop All", href: "/shop" },
    { label: "Men", href: "/shop?category=men" },
    { label: "Women", href: "/shop?category=women" },
    { label: "Oversized & Casual", href: "/shop?category=casual" },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
    }
  };

  return (
    <>
      {/* Top Announcement Bar */}
      <aside
        aria-label="Announcement"
        className="bg-neutral-900 text-neutral-300 text-xs tracking-widest uppercase py-2 px-4 text-center border-b border-neutral-800"
      >
        Free Shipping on Orders Over $75 &bull; Consciously Made Essentials
      </aside>

      {/* Main Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-100 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18">
            {/* Mobile Menu Button */}
            <div className="flex items-center md:hidden">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-neutral-700 hover:text-black focus:outline-none"
                aria-label="Toggle Navigation Menu"
              >
                {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>

            {/* Brand Logo */}
            <div className="flex-1 md:flex-initial flex justify-center md:justify-start">
              <Link href="/" className="group flex flex-col">
                <span className="font-serif text-2xl font-bold tracking-tight text-neutral-950 group-hover:opacity-80 transition">
                  THREADCRAFT
                </span>
                <span className="text-[10px] tracking-[0.28em] text-neutral-500 uppercase -mt-1 font-mono">
                  STUDIO &bull; ESSENTIALS
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-neutral-600 hover:text-black transition tracking-wide py-2"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right Action Icons */}
            <div className="flex items-center space-x-3 sm:space-x-5">
              {/* Search Toggle */}
              <button
                type="button"
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2 text-neutral-700 hover:text-black hover:bg-neutral-100 rounded-full transition"
                aria-label="Search store"
              >
                <Search size={20} />
              </button>

              {/* Shopping Bag Button */}
              <button
                type="button"
                onClick={openCart}
                className="relative p-2 text-neutral-900 hover:text-black hover:bg-neutral-100 rounded-full transition flex items-center"
                aria-label={`Shopping Bag (${mounted ? totalItems : 0} items)`}
              >
                <ShoppingBag size={21} />
                {mounted && totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-black text-white text-[11px] font-semibold h-5 w-5 rounded-full flex items-center justify-center animate-pulse">
                    {totalItems}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Search Dropdown Input */}
          {searchOpen && (
            <div className="py-3 px-2 border-t border-neutral-100">
              <form onSubmit={handleSearchSubmit} className="relative max-w-xl mx-auto">
                <input
                  type="text"
                  placeholder="Search t-shirts, hoodies, trousers, linen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-lg py-2.5 pl-10 pr-12 text-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
                  autoFocus
                />
                <Search size={18} className="absolute left-3.5 top-3.5 text-neutral-400" />
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="absolute right-3 top-3 text-xs text-neutral-400 hover:text-black"
                >
                  ESC
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-neutral-200 bg-white px-4 pt-3 pb-6 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-base font-medium text-neutral-800 hover:text-black border-b border-neutral-100"
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </header>
    </>
  );
}
