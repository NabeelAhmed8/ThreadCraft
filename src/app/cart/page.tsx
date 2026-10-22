"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag } from "lucide-react";

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, clearCart, subtotal, totalItems } =
    useCart();

  const shipping = subtotal >= 75 || subtotal === 0 ? 0 : 10;
  const total = subtotal + shipping;

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 text-center">
        <div className="w-20 h-20 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-6 text-neutral-400">
          <ShoppingBag size={32} />
        </div>
        <h1 className="font-serif text-3xl font-bold tracking-tight text-neutral-950">
          Your shopping bag is empty
        </h1>
        <p className="text-sm text-neutral-500 mt-2 max-w-md mx-auto">
          Explore our collection of modern minimalist clothing essentials and add items to your cart.
        </p>
        <div className="mt-8">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 bg-black text-white text-xs uppercase tracking-widest font-medium px-8 py-4 rounded hover:bg-neutral-800 transition"
          >
            <span>Explore Collection</span>
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <div className="border-b border-neutral-200 pb-6 mb-10 flex justify-between items-end">
        <div>
          <span className="text-[11px] font-mono tracking-widest uppercase text-neutral-500">
            Review Bag
          </span>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-neutral-950 mt-1">
            Shopping Bag ({totalItems} {totalItems === 1 ? "item" : "items"})
          </h1>
        </div>
        <button
          onClick={clearCart}
          className="text-xs text-neutral-500 hover:text-red-600 underline"
        >
          Clear all items
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Items List */}
        <div className="lg:col-span-8 space-y-6">
          {cart.map((item) => (
            <div
              key={item.id}
              className="flex gap-6 pb-6 border-b border-neutral-200 last:border-b-0 items-start"
            >
              {/* Product Thumbnail */}
              <div className="relative w-28 h-36 bg-neutral-100 rounded-lg overflow-hidden shrink-0">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="112px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-neutral-400">
                    No image
                  </div>
                )}
              </div>

              {/* Product Details */}
              <div className="flex-1 flex flex-col justify-between self-stretch">
                <div>
                  <div className="flex justify-between items-start">
                    <Link
                      href={`/product/${item.productId}`}
                      className="font-serif text-lg font-medium text-neutral-900 hover:underline"
                    >
                      {item.name}
                    </Link>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-neutral-400 hover:text-red-600 transition p-1"
                      aria-label="Remove item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="flex items-center gap-4 mt-2 text-xs text-neutral-500">
                    <span>Size: <strong className="text-neutral-800">{item.size}</strong></span>
                    {item.color && (
                      <span>Color: <strong className="text-neutral-800">{item.color}</strong></span>
                    )}
                    <span>Unit: ${item.price.toFixed(2)}</span>
                  </div>
                </div>

                {/* Quantity and Subtotal */}
                <div className="flex justify-between items-center mt-6">
                  <div className="flex items-center border border-neutral-300 rounded">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="p-1.5 hover:bg-neutral-100 text-neutral-600 transition"
                      aria-label="Decrease quantity"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="px-4 text-xs font-semibold text-neutral-900">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-1.5 hover:bg-neutral-100 text-neutral-600 transition"
                      aria-label="Increase quantity"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  <span className="text-base font-semibold text-neutral-950">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-4">
          <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-6 space-y-5 sticky top-24">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-900 border-b border-neutral-200 pb-3">
              Order Summary
            </h2>

            <div className="space-y-3 text-sm text-neutral-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-medium text-neutral-900">${subtotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between">
                <span>Shipping</span>
                <span>
                  {shipping === 0 ? (
                    <span className="text-green-600 font-medium">Free</span>
                  ) : (
                    `$${shipping.toFixed(2)}`
                  )}
                </span>
              </div>

              {shipping > 0 && (
                <div className="text-[11px] text-neutral-500 bg-white p-2.5 rounded border border-neutral-200">
                  Add <strong>${(75 - subtotal).toFixed(2)}</strong> more to unlock Free Worldwide Shipping.
                </div>
              )}
            </div>

            <div className="border-t border-neutral-200 pt-4 flex justify-between items-center text-base font-semibold text-neutral-950">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>

            <Link
              href="/checkout"
              className="w-full flex items-center justify-center gap-2 bg-black text-white text-xs uppercase tracking-widest font-semibold py-4 rounded hover:bg-neutral-800 transition"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight size={15} />
            </Link>

            <p className="text-[11px] text-neutral-500 text-center">
              Taxes and duties calculated upon delivery destination.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
