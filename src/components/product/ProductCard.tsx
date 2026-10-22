"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Product } from "@/types";
import { useCart } from "@/context/CartContext";
import { Plus, Check } from "lucide-react";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const [isAdded, setIsAdded] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string>(
    product.sizes && product.sizes.length > 0 ? product.sizes[0] : "One Size"
  );

  const primaryImage =
    product.images && product.images.length > 0
      ? product.images[0]
      : "/images/placeholder.jpg";

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, selectedSize, product.colors?.[0] || undefined, 1);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  };

  return (
    <div className="group relative flex flex-col">
      {/* Product Image Box */}
      <Link
        href={`/product/${product.id}`}
        className="relative w-full aspect-3/4 bg-neutral-100 rounded-lg overflow-hidden block"
      >
        {primaryImage ? (
          <Image
            src={primaryImage}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-neutral-400">
            No image available
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
          {product.featured && (
            <span className="bg-black text-white text-[10px] uppercase tracking-widest font-medium px-2 py-0.5 rounded">
              Featured
            </span>
          )}
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <span className="bg-red-600 text-white text-[10px] uppercase tracking-widest font-medium px-2 py-0.5 rounded">
              Sale
            </span>
          )}
          {!product.inStock && (
            <span className="bg-neutral-800 text-neutral-200 text-[10px] uppercase tracking-widest font-medium px-2 py-0.5 rounded">
              Sold Out
            </span>
          )}
        </div>

        {/* Quick Add Overlay on Desktop Hover */}
        {product.inStock && (
          <div className="absolute inset-x-2 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 hidden sm:block">
            <button
              onClick={handleQuickAdd}
              className="w-full bg-white/95 backdrop-blur-sm text-black hover:bg-black hover:text-white text-xs uppercase tracking-wider font-medium py-2.5 rounded shadow-sm transition flex items-center justify-center gap-1.5"
            >
              {isAdded ? (
                <>
                  <Check size={14} /> Added
                </>
              ) : (
                <>
                  <Plus size={14} /> Quick Add ({selectedSize})
                </>
              )}
            </button>
          </div>
        )}
      </Link>

      {/* Info Section */}
      <div className="mt-3 flex flex-col flex-1">
        <div className="flex justify-between items-start">
          <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500">
            {product.category || "Apparel"}
          </span>
          {product.sizes && product.sizes.length > 1 && (
            <div className="hidden sm:flex items-center gap-1">
              {product.sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`text-[10px] px-1 py-0.5 border rounded ${
                    selectedSize === size
                      ? "border-black font-semibold text-black bg-neutral-100"
                      : "border-neutral-200 text-neutral-500 hover:border-neutral-400"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          )}
        </div>

        <Link
          href={`/product/${product.id}`}
          className="text-sm font-medium text-neutral-900 hover:underline mt-1 line-clamp-1"
        >
          {product.name}
        </Link>

        {/* Price */}
        <div className="mt-1 flex items-center gap-2">
          <span className="text-sm font-semibold text-neutral-900">
            ${Number(product.price).toFixed(2)}
          </span>
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <span className="text-xs text-neutral-400 line-through">
              ${Number(product.compareAtPrice).toFixed(2)}
            </span>
          )}
        </div>

        {/* Mobile quick add button */}
        {product.inStock && (
          <button
            onClick={handleQuickAdd}
            className="sm:hidden mt-2 w-full py-1.5 border border-neutral-300 text-xs font-medium uppercase tracking-wider rounded text-neutral-900 hover:bg-neutral-100"
          >
            {isAdded ? "Added to Bag" : "Add to Bag"}
          </button>
        )}
      </div>
    </div>
  );
}
