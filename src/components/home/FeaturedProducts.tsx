"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Product } from "@/types";
import { getProducts } from "@/lib/api";
import ProductCard from "@/components/product/ProductCard";
import { ProductGridSkeleton } from "@/components/product/ProductSkeleton";
import BackendStatusAlert from "@/components/common/BackendStatusAlert";
import { ArrowRight } from "lucide-react";

interface FeaturedProductsProps {
  initialProducts?: Product[];
}

export default function FeaturedProducts({
  initialProducts = [],
}: FeaturedProductsProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(initialProducts.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  useEffect(() => {
    // If initialProducts was pre-rendered and no manual reload requested, skip extra client-side fetch
    if (initialProducts.length > 0 && reloadTrigger === 0) {
      return;
    }

    let active = true;

    async function fetchFeatured() {
      try {
        const res = await getProducts({ limit: 8, featured: true });
        if (!active) return;

        if (res.error) {
          setError(res.error);
          setProducts([]);
        } else {
          setProducts(res.products || []);
          setError(null);
        }
      } catch (err: unknown) {
        if (!active) return;
        setError(
          err instanceof Error ? err.message : "Unable to load featured products"
        );
        setProducts([]);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchFeatured();

    return () => {
      active = false;
    };
  }, [reloadTrigger, initialProducts]);

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    setReloadTrigger((prev) => prev + 1);
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 pb-4 border-b border-neutral-200">
        <div>
          <span className="text-[11px] font-mono tracking-widest uppercase text-neutral-500">
            Current Rotation
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950 mt-1">
            Featured Garments
          </h2>
        </div>
        <Link
          href="/shop"
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-800 hover:text-black mt-3 sm:mt-0 group"
        >
          <span>View All Essentials</span>
          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Loading Skeleton */}
      {loading && <ProductGridSkeleton count={8} />}

      {/* Error Alert */}
      {!loading && error && (
        <BackendStatusAlert
          error={error}
          onRetry={handleRetry}
          message="Unable to load featured garments right now. Please try again."
        />
      )}

      {/* Empty State when backend has 0 products */}
      {!loading && !error && products.length === 0 && (
        <BackendStatusAlert
          onRetry={handleRetry}
          message="No Products Found"
        />
      )}

      {/* Products Grid */}
      {!loading && !error && products.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
          {products.map((product, idx) => (
            <ProductCard
              key={product.id}
              product={product}
              priority={idx < 4}
            />
          ))}
        </div>
      )}
    </section>
  );
}
