import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export default function HeroBanner() {
  return (
    <section className="relative bg-neutral-100 overflow-hidden border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 border border-neutral-300 bg-white/70 backdrop-blur-xs px-3 py-1 rounded-full text-[11px] font-mono tracking-widest uppercase text-neutral-800 mb-6">
            <span>Autumn / Winter &bull; Collection</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-neutral-950 leading-[1.08]">
            Crafted for everyday essentials.
          </h1>

          <p className="mt-6 text-base sm:text-lg text-neutral-600 leading-relaxed max-w-xl font-light">
            Minimalist silhouettes, heavy-gauge cottons, and timeless tailoring.
            Designed to outlast seasonal trends and elevate your everyday wardrobe.
          </p>

          <div className="mt-8 flex flex-wrap gap-4 items-center">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 bg-neutral-950 text-white text-xs uppercase tracking-widest font-medium px-7 py-4 rounded hover:bg-neutral-800 transition"
            >
              <span>Explore Collection</span>
              <ArrowUpRight size={16} />
            </Link>

            <Link
              href="/shop?category=new"
              className="inline-flex items-center text-xs uppercase tracking-widest font-medium text-neutral-800 hover:text-black border border-neutral-300 bg-white px-7 py-4 rounded hover:border-black transition"
            >
              New Arrivals
            </Link>
          </div>

          {/* Minimalist Trust Signals */}
          <div className="mt-14 pt-8 border-t border-neutral-200 grid grid-cols-3 gap-6 text-left">
            <div>
              <span className="block text-lg font-bold text-neutral-950 font-serif">100%</span>
              <span className="text-[11px] text-neutral-500 uppercase tracking-wider">Organic Cotton</span>
            </div>
            <div>
              <span className="block text-lg font-bold text-neutral-950 font-serif">Ethical</span>
              <span className="text-[11px] text-neutral-500 uppercase tracking-wider">Small-Batch Tailored</span>
            </div>
            <div>
              <span className="block text-lg font-bold text-neutral-950 font-serif">30-Day</span>
              <span className="text-[11px] text-neutral-500 uppercase tracking-wider">Hassle-Free Returns</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
