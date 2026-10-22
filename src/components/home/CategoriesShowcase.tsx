import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const categories = [
  {
    title: "Men's Essentials",
    description: "Relaxed tees, heavy overshirts & classic oxford shirts",
    category: "men",
    image:
      "https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=800&q=80",
  },
  {
    title: "Women's Silhouettes",
    description: "Crisp poplin shirts, pleated trousers & linen dresses",
    category: "women",
    image:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80",
  },
  {
    title: "Heavy Knits & Fleece",
    description: "500 GSM loopback cotton hoodies & brushed sweaters",
    category: "outerwear",
    image:
      "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80",
  },
];

export default function CategoriesShowcase() {
  return (
    <section className="bg-neutral-50 py-20 border-y border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-14">
          <span className="text-[11px] font-mono tracking-widest uppercase text-neutral-500">
            Categorical Editions
          </span>
          <h2 className="font-serif text-3xl font-bold tracking-tight text-neutral-950 mt-1">
            Shop by Silhouette
          </h2>
          <p className="text-sm text-neutral-600 mt-2">
            Curated categories designed to build a cohesive minimalist wardrobe.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {categories.map((cat) => (
            <Link
              key={cat.category}
              href={`/shop?category=${cat.category}`}
              className="group relative bg-white border border-neutral-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col"
            >
              <div className="relative aspect-4/3 w-full overflow-hidden bg-neutral-200">
                {/* Visual backdrop */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cat.image}
                  alt={cat.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
                  <span className="text-lg font-serif font-semibold">
                    {cat.title}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center group-hover:bg-white group-hover:text-black transition">
                    <ArrowUpRight size={16} />
                  </div>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <p className="text-xs text-neutral-600 leading-relaxed">
                  {cat.description}
                </p>
                <span className="mt-3 text-[11px] font-medium uppercase tracking-wider text-neutral-900 group-hover:underline">
                  Explore Category &rarr;
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
