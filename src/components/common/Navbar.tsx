"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  ShoppingBag,
  Menu,
  Search,
  User as UserIcon,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { MobileNavDrawer, NavLinkItem } from "@/components/common/MobileNavDrawer";

const NAV_LINKS: NavLinkItem[] = [
  { label: "Shop All", href: "/shop", badge: "New" },
  { label: "Men", href: "/shop?category=men" },
  { label: "Women", href: "/shop?category=women" },
  { label: "Oversized & Casual", href: "/shop?category=casual" },
];

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { totalItems, openCart } = useCart();
  const { user } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isClient, setIsClient] = useState(false);

  // Hydration-safe client activation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsClient(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Close mobile drawer and search on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setMobileMenuOpen(false);
    }
  };

  return (
    <>
      {/* Top Announcement Bar */}
      <aside
        aria-label="Announcement"
        className="bg-neutral-950 text-neutral-300 text-[11px] tracking-widest uppercase py-2 px-4 text-center border-b border-neutral-900 flex items-center justify-center gap-2"
      >
        <span>Free Shipping on Orders Over $75</span>
        <span className="hidden sm:inline">&bull; Consciously Made Essentials</span>
      </aside>

      {/* Main Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200/70 transition-colors">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Left: Mobile Hamburger Button */}
            <div className="flex items-center md:hidden">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="p-2 -ml-1 text-neutral-800 hover:text-black hover:bg-neutral-100 rounded-lg focus:outline-none transition"
                aria-label="Open Navigation Menu"
              >
                <Menu size={22} />
              </button>
            </div>

            {/* Brand Logo */}
            <div className="flex-1 md:flex-initial flex justify-center md:justify-start">
              <Link href="/" className="group flex flex-col text-center md:text-left">
                <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-neutral-950 group-hover:opacity-85 transition">
                  THREADCRAFT
                </span>
                <span className="text-[8px] sm:text-[9px] tracking-[0.28em] text-neutral-500 uppercase -mt-0.5 sm:-mt-1 font-mono">
                  STUDIO &bull; ESSENTIALS
                </span>
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center space-x-8">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-neutral-600 hover:text-black transition tracking-wide py-2 relative group"
                >
                  <span>{link.label}</span>
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-black transition-all duration-200 group-hover:w-full" />
                </Link>
              ))}
            </nav>

            {/* Right Action Icons */}
            <div className="flex items-center space-x-1 sm:space-x-3">
              {/* Search Toggle */}
              <button
                type="button"
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2 text-neutral-700 hover:text-black hover:bg-neutral-100 rounded-full transition"
                aria-label="Search garments"
                title="Search"
              >
                <Search size={19} />
              </button>

              {/* User Account Link (Desktop Only — mobile access is via hamburger drawer) */}
              {isClient && user ? (
                <Link
                  href="/profile"
                  className="hidden md:flex items-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1.5 text-neutral-800 hover:text-black hover:bg-neutral-100 rounded-full transition"
                  title="My Profile"
                  aria-label="User Profile"
                >
                  <div className="w-7 h-7 rounded-full bg-neutral-950 text-white flex items-center justify-center text-xs font-serif font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden lg:inline-block text-xs font-medium">
                    Hi, {user.name.split(" ")[0]}
                  </span>
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="hidden md:flex p-2 text-neutral-700 hover:text-black hover:bg-neutral-100 rounded-full transition"
                  aria-label="Sign In"
                  title="Sign In"
                >
                  <UserIcon size={19} />
                </Link>
              )}

              {/* Shopping Bag Button */}
              <button
                type="button"
                onClick={openCart}
                className="relative p-2 text-neutral-900 hover:text-black hover:bg-neutral-100 rounded-full transition flex items-center"
                aria-label="Shopping Bag"
                title="View Bag"
              >
                <ShoppingBag size={20} />
                {isClient && totalItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-neutral-950 text-white text-[10px] font-bold h-4.5 w-4.5 min-w-4.5 px-1 rounded-full flex items-center justify-center shadow-xs">
                    {totalItems}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Search Dropdown Input Bar */}
          {searchOpen && (
            <div className="py-3 px-1 border-t border-neutral-100 animate-in fade-in slide-in-from-top-2 duration-150">
              <form
                id="desktop-search-form"
                name="desktopSearchForm"
                onSubmit={handleSearchSubmit}
                className="relative max-w-xl mx-auto"
              >
                <label htmlFor="desktop-nav-search" className="sr-only">
                  Search collections and products
                </label>
                <input
                  id="desktop-nav-search"
                  name="search"
                  type="search"
                  autoComplete="off"
                  placeholder="Search t-shirts, hoodies, outerwear, linen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-lg py-2.5 pl-10 pr-12 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
                  autoFocus
                />
                <Search size={17} className="absolute left-3.5 top-3.5 text-neutral-400" />
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="absolute right-3 top-3 text-[11px] font-mono uppercase text-neutral-400 hover:text-black"
                >
                  ESC
                </button>
              </form>
            </div>
          )}
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      <MobileNavDrawer
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        navLinks={NAV_LINKS}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
        isClient={isClient}
      />
    </>
  );
}
