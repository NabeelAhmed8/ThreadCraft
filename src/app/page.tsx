import React from "react";
import HeroBanner from "@/components/home/HeroBanner";
import ValuesBanner from "@/components/home/ValuesBanner";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import CategoriesShowcase from "@/components/home/CategoriesShowcase";
import Link from "next/link";

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <HeroBanner />

      {/* Values & Guarantees Bar */}
      <ValuesBanner />

      {/* Dynamic Featured Products (Direct from Backend API) */}
      <FeaturedProducts />

      {/* Categories Showcase */}
      <CategoriesShowcase />

      {/* Studio Philosophy / Editorial Block */}
      <section className="bg-neutral-900 text-white py-24 border-t border-neutral-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-[11px] font-mono tracking-[0.25em] uppercase text-neutral-400">
            Design Philosophy
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-light tracking-tight mt-3 leading-snug">
            &ldquo;Perfection is achieved not when there is nothing more to add,
            but when there is nothing left to take away.&rdquo;
          </h2>
          <p className="mt-6 text-sm text-neutral-400 max-w-xl mx-auto leading-relaxed">
            Every ThreadCraft piece begins with pure Japanese and European textiles, cut into relaxed,
            unpretentious silhouettes designed for decades of daily wear.
          </p>
          <div className="mt-8">
            <Link
              href="/shop"
              className="inline-block border border-white text-white text-xs uppercase tracking-widest px-8 py-3.5 rounded hover:bg-white hover:text-black transition"
            >
              Explore the Archive
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
