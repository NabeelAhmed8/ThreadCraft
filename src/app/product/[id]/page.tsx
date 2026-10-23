"use client";

import React, { useEffect, useState, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { Product } from "@/types";
import { getProductById } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import BackendStatusAlert from "@/components/common/BackendStatusAlert";
import {
  ArrowLeft,
  ShoppingBag,
  Check,
  Truck,
  RotateCcw,
  Shield,
} from "lucide-react";

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const productId = resolvedParams.id;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const { addToCart } = useCart();

  useEffect(() => {
    async function loadProduct() {
      setLoading(true);
      setError(null);
      try {
        const res = await getProductById(productId);
        if (res.error || !res.product) {
          setError(res.error || "Product not found");
          setProduct(null);
        } else {
          setProduct(res.product);
          if (res.product.sizes && res.product.sizes.length > 0) {
            setSelectedSize(res.product.sizes[0]);
          }
          if (res.product.colors && res.product.colors.length > 0) {
            setSelectedColor(res.product.colors[0]);
          }
        }
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "Failed to load product details"
        );
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [productId]);

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(
      product,
      selectedSize || "Standard",
      selectedColor || undefined,
      quantity
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="aspect-3/4 bg-neutral-200 rounded-xl" />
          <div className="space-y-4">
            <div className="h-4 bg-neutral-200 rounded w-1/4" />
            <div className="h-8 bg-neutral-200 rounded w-3/4" />
            <div className="h-6 bg-neutral-200 rounded w-1/3" />
            <div className="h-24 bg-neutral-200 rounded w-full mt-6" />
            <div className="h-12 bg-neutral-200 rounded w-full mt-8" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-neutral-600 hover:text-black mb-8"
        >
          <ArrowLeft size={16} /> Back to Catalog
        </Link>
        <BackendStatusAlert
          message="Product not found"
        />
      </div>
    );
  }

  const images = product.images && product.images.length > 0 ? product.images : [];
  const currentImage = images[activeImageIndex] || "/images/placeholder.jpg";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Back button */}
      <Link
        href="/shop"
        className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-neutral-500 hover:text-black mb-8 transition"
      >
        <ArrowLeft size={15} /> Back to Catalog
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">
        {/* Gallery Section */}
        <div className="space-y-4">
          <div className="relative aspect-3/4 w-full bg-neutral-100 rounded-xl overflow-hidden shadow-xs">
            <Image
              src={currentImage}
              alt={product.name}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover object-center"
            />
          </div>

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative w-20 h-24 rounded-lg overflow-hidden border-2 shrink-0 transition ${
                    activeImageIndex === idx
                      ? "border-black ring-1 ring-black"
                      : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <Image
                    src={img}
                    alt={`${product.name} thumbnail ${idx + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Meta Section */}
        <div className="flex flex-col justify-between">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-neutral-500">
              {product.category || "Apparel"}
            </span>

            <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-neutral-950 mt-2">
              {product.name}
            </h1>

            {/* Price */}
            <div className="mt-3 flex items-center gap-3">
              <span className="text-2xl font-semibold text-neutral-900">
                ${Number(product.price).toFixed(2)}
              </span>
              {product.compareAtPrice && product.compareAtPrice > product.price && (
                <span className="text-base text-neutral-400 line-through">
                  ${Number(product.compareAtPrice).toFixed(2)}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="mt-6 text-sm text-neutral-600 leading-relaxed font-light whitespace-pre-line">
              {product.description ||
                "Tailored from responsibly sourced materials. Designed for comfortable everyday wear with effortless minimalist drape."}
            </p>

            {/* Size Selector */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="mt-8">
                <div className="flex justify-between items-center text-xs font-medium text-neutral-900 mb-3">
                  <span className="uppercase tracking-wider">Select Size</span>
                  <span className="text-neutral-500 font-normal">
                    Selected: {selectedSize}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`min-w-12 h-11 px-3 rounded text-xs font-medium uppercase tracking-wider transition ${
                        selectedSize === size
                          ? "bg-black text-white"
                          : "border border-neutral-300 text-neutral-800 hover:border-black"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Selector (if available) */}
            {product.colors && product.colors.length > 0 && (
              <div className="mt-6">
                <span className="text-xs font-medium uppercase tracking-wider text-neutral-900 block mb-2">
                  Color: {selectedColor}
                </span>
                <div className="flex gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-3 py-1.5 text-xs rounded border transition ${
                        selectedColor === color
                          ? "border-black font-semibold bg-neutral-100"
                          : "border-neutral-200 text-neutral-600 hover:border-neutral-400"
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="mt-8 flex items-center gap-4">
              <span className="text-xs font-medium uppercase tracking-wider text-neutral-900">
                Quantity:
              </span>
              <div className="flex items-center border border-neutral-300 rounded">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-1.5 text-sm hover:bg-neutral-100"
                >
                  -
                </button>
                <span className="px-3 text-xs font-semibold">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-1.5 text-sm hover:bg-neutral-100"
                >
                  +
                </button>
              </div>
            </div>

            {/* Add to Bag Button */}
            <div className="mt-8">
              <button
                onClick={handleAddToCart}
                disabled={!product.inStock}
                className={`w-full py-4 rounded text-xs uppercase tracking-widest font-semibold flex items-center justify-center gap-2 transition ${
                  product.inStock
                    ? "bg-black text-white hover:bg-neutral-800 shadow-sm"
                    : "bg-neutral-200 text-neutral-500 cursor-not-allowed"
                }`}
              >
                {product.inStock ? (
                  added ? (
                    <>
                      <Check size={16} /> Added to Bag
                    </>
                  ) : (
                    <>
                      <ShoppingBag size={16} /> Add to Bag &bull; $
                      {(product.price * quantity).toFixed(2)}
                    </>
                  )
                ) : (
                  "Currently Sold Out"
                )}
              </button>
            </div>
          </div>

          {/* Delivery & Assurance Details */}
          <div className="mt-12 pt-8 border-t border-neutral-200 space-y-3.5 text-xs text-neutral-600">
            <div className="flex items-center gap-3">
              <Truck size={17} className="text-neutral-800 shrink-0" />
              <span>Complimentary standard shipping on all orders over $75.</span>
            </div>
            <div className="flex items-center gap-3">
              <RotateCcw size={17} className="text-neutral-800 shrink-0" />
              <span>30-day effortless return and exchange policy.</span>
            </div>
            <div className="flex items-center gap-3">
              <Shield size={17} className="text-neutral-800 shrink-0" />
              <span>Guaranteed sustainable textiles and ethical tailoring.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
