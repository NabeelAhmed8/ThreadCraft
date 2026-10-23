"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Product } from "@/types";
import { useCart } from "@/context/CartContext";
import { ShoppingBag, Check } from "lucide-react";

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

export default function ProductCard({ product, priority = false }: ProductCardProps) {
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
    <div className="group relative flex flex-col justify-between h-full bg-white rounded-xl">
      <div>
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
              priority={priority}
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
              <span className="bg-black text-white text-[10px] uppercase tracking-widest font-medium px-2 py-0.5 rounded shadow-xs">
                Featured
              </span>
            )}
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="bg-red-600 text-white text-[10px] uppercase tracking-widest font-medium px-2 py-0.5 rounded shadow-xs">
                Sale
              </span>
            )}
            {!product.inStock && (
              <span className="bg-neutral-800 text-neutral-200 text-[10px] uppercase tracking-widest font-medium px-2 py-0.5 rounded shadow-xs">
                Sold Out
              </span>
            )}
          </div>
        </Link>

        {/* Info Section */}
        <div className="mt-3 flex flex-col">
          <div className="flex justify-between items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 truncate">
              {product.category || "Apparel"}
            </span>

            {/* Quick Size Selectors */}
            {product.sizes && product.sizes.length > 1 && (
              <div className="flex items-center gap-1 shrink-0">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedSize(size);
                    }}
                    title={`Select size ${size}`}
                    className={`text-[10px] px-1.5 py-0.5 border rounded transition ${
                      selectedSize === size
                        ? "border-black font-semibold text-black bg-neutral-100 shadow-xs"
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
        </div>
      </div>

      {/* Prominent Add to Bag Action Button (Always Visible on Desktop & Mobile) */}
      <div className="mt-3 pt-1">
        {product.inStock ? (
          <button
            type="button"
            onClick={handleQuickAdd}
            className={`w-full py-2.5 px-3 text-xs uppercase tracking-wider font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-xs ${
              isAdded
                ? "bg-emerald-700 text-white"
                : "bg-neutral-950 text-white hover:bg-neutral-800 active:scale-[0.98]"
            }`}
          >
            {isAdded ? (
              <>
                <Check size={14} className="stroke-[2.5]" />
                <span>Added to Bag</span>
              </>
            ) : (
              <>
                <ShoppingBag size={14} />
                <span>Add to Bag</span>
              </>
            )}
          </button>
        ) : (
          <button
            disabled
            type="button"
            className="w-full py-2.5 px-3 text-xs uppercase tracking-wider font-semibold rounded-lg bg-neutral-100 text-neutral-400 cursor-not-allowed border border-neutral-200"
          >
            Sold Out
          </button>
        )}
      </div>
    </div>
  );
}
