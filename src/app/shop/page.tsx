"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Product } from "@/types";
import { getProducts } from "@/lib/api";
import ProductCard from "@/components/product/ProductCard";
import { ProductGridSkeleton } from "@/components/product/ProductSkeleton";
import BackendStatusAlert from "@/components/common/BackendStatusAlert";
import Pagination from "@/components/common/Pagination";
import { SlidersHorizontal } from "lucide-react";

const CATEGORIES = [
  { label: "All Items", value: "" },
  { label: "Men", value: "men" },
  { label: "Women", value: "women" },
  { label: "Outerwear & Knits", value: "outerwear" },
  { label: "Casual & Tees", value: "casual" },
];

const ITEMS_PER_PAGE = 8;

function ShopContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const category = searchParams.get("category") || "";
  const search = searchParams.get("search") || "";
  const pageParam = parseInt(searchParams.get("page") || "1", 10);
  const currentPage = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;

  const [sort, setSort] = useState("newest");
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = await getProducts({
          category: category || undefined,
          search: search || undefined,
          sort,
          page: currentPage,
          limit: ITEMS_PER_PAGE,
        });

        if (!active) return;

        if (res.error) {
          setError(res.error);
          setProducts([]);
          setTotal(0);
          setTotalPages(1);
        } else {
          setProducts(res.products || []);
          const totalItems = res.total ?? 0;
          setTotal(totalItems);
          setTotalPages(res.totalPages || Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE)));
          setError(null);
        }
      } catch (err: unknown) {
        if (!active) return;
        setError(
          err instanceof Error ? err.message : "Unable to load collection right now."
        );
        setProducts([]);
        setTotal(0);
        setTotalPages(1);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [category, search, sort, currentPage, reloadTrigger]);

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    setReloadTrigger((prev) => prev + 1);
  };

  const handleCategoryChange = (catValue: string) => {
    setLoading(true);
    const params = new URLSearchParams(searchParams.toString());
    if (catValue) {
      params.set("category", catValue);
    } else {
      params.delete("category");
    }
    params.delete("page"); // Reset to page 1 on category change
    router.push(`/shop?${params.toString()}`);
  };

  const handleSortChange = (newSort: string) => {
    setLoading(true);
    setSort(newSort);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page"); // Reset to page 1 on sort change
    router.push(`/shop?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage === currentPage || newPage < 1 || newPage > totalPages) return;
    setLoading(true);
    const params = new URLSearchParams(searchParams.toString());
    if (newPage > 1) {
      params.set("page", newPage.toString());
    } else {
      params.delete("page");
    }
    router.push(`/shop?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const startRange = total === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endRange = Math.min(currentPage * ITEMS_PER_PAGE, total);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="border-b border-neutral-200 pb-8">
        <span className="text-[11px] font-mono tracking-widest uppercase text-neutral-500">
          ThreadCraft Studio &bull; Catalog
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-neutral-950 mt-1 capitalize">
          {category ? `${category} Collection` : "All Apparel"}
        </h1>
        {search && (
          <p className="text-xs text-neutral-600 mt-1">
            Search results for &ldquo;{search}&rdquo;
          </p>
        )}
      </div>

      <div className="py-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-100">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => handleCategoryChange(cat.value)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium tracking-wide whitespace-nowrap transition ${
                category === cat.value
                  ? "bg-black text-white"
                  : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-3 self-end md:self-auto">
          <SlidersHorizontal size={15} className="text-neutral-500" />
          <label htmlFor="shop-sort-by" className="text-xs text-neutral-500 cursor-pointer">
            Sort by:
          </label>
          <select
            id="shop-sort-by"
            name="sort"
            autoComplete="off"
            value={sort}
            onChange={(e) => handleSortChange(e.target.value)}
            className="text-xs bg-white border border-neutral-300 rounded px-2.5 py-1.5 text-neutral-800 focus:outline-none focus:ring-1 focus:ring-black"
          >
            <option value="newest">Newest First</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      <div className="py-4 text-xs text-neutral-500">
        {!loading && !error && total > 0 && `Showing ${startRange}–${endRange} of ${total} items`}
      </div>

      {loading && <ProductGridSkeleton count={8} />}

      {!loading && error && (
        <BackendStatusAlert
          error={error}
          onRetry={handleRetry}
          message="Unable to load products right now. Please check your connection or try again."
        />
      )}

      {!loading && !error && products.length === 0 && (
        <BackendStatusAlert
          onRetry={handleRetry}
          message="No Products Found"
        />
      )}

      {!loading && !error && products.length > 0 && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
            {products.map((product, idx) => (
              <ProductCard
                key={product.id}
                product={product}
                priority={idx < 4}
              />
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            className="mt-12 pt-8 border-t border-neutral-100"
          />
        </>
      )}
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto p-12"><ProductGridSkeleton count={8} /></div>}>
      <ShopContent />
    </Suspense>
  );
}
