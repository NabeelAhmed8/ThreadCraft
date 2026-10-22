"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { createOrder } from "@/lib/api";
import { OrderCustomer, OrderPayload } from "@/types";
import { CheckCircle2, Lock, ArrowLeft, AlertCircle } from "lucide-react";

export default function CheckoutPage() {
  const { cart, subtotal, clearCart } = useCart();

  const [customer, setCustomer] = useState<OrderCustomer>({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    country: "Pakistan",
  });

  const [paymentMethod, setPaymentMethod] = useState<"cod" | "card" | "stripe">("cod");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderComplete, setOrderComplete] = useState<{
    orderId?: string | number;
    message?: string;
  } | null>(null);

  const shipping = subtotal >= 75 || subtotal === 0 ? 0 : 10;
  const total = subtotal + shipping;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setCustomer({ ...customer, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const payload: OrderPayload = {
      customer,
      items: cart,
      subtotal,
      shipping,
      total,
      paymentMethod,
    };

    const res = await createOrder(payload);

    setSubmitting(false);

    if (res.success) {
      setOrderComplete({
        orderId: res.orderId || `TC-${Date.now().toString().slice(-6)}`,
        message: res.message,
      });
      clearCart();
    } else {
      setError(
        res.message ||
          "Failed to place order with backend server. Check backend connection."
      );
    }
  };

  if (orderComplete) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <div className="w-16 h-16 bg-neutral-900 text-white rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={36} />
        </div>
        <span className="text-xs font-mono uppercase tracking-widest text-neutral-500">
          Order Confirmed
        </span>
        <h1 className="font-serif text-3xl font-bold tracking-tight text-neutral-950 mt-2">
          Thank you for your order!
        </h1>
        <p className="text-sm text-neutral-600 mt-3">
          Your order identifier is{" "}
          <strong className="text-neutral-900 font-mono">
            #{orderComplete.orderId}
          </strong>
          . A confirmation details package has been registered with the backend.
        </p>

        <div className="mt-10 border-t border-neutral-200 pt-8 flex justify-center gap-4">
          <Link
            href="/shop"
            className="bg-black text-white text-xs uppercase tracking-widest font-semibold px-8 py-3.5 rounded hover:bg-neutral-800 transition"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <h2 className="font-serif text-2xl font-bold text-neutral-900">
          Your bag is empty
        </h2>
        <p className="text-xs text-neutral-500 mt-2">
          Please add items to your shopping bag before proceeding to checkout.
        </p>
        <Link
          href="/shop"
          className="mt-6 inline-block bg-black text-white text-xs uppercase tracking-widest font-semibold px-6 py-3 rounded"
        >
          Go to Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link
        href="/cart"
        className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-neutral-500 hover:text-black mb-8 transition"
      >
        <ArrowLeft size={15} /> Return to Bag
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Checkout Form */}
        <div className="lg:col-span-7">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Contact details */}
            <div className="border border-neutral-200 rounded-xl p-6 bg-white space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-900">
                1. Contact &amp; Shipping Address
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    required
                    value={customer.fullName}
                    onChange={handleChange}
                    className="w-full border border-neutral-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={customer.email}
                    onChange={handleChange}
                    className="w-full border border-neutral-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={customer.phone}
                    onChange={handleChange}
                    className="w-full border border-neutral-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    name="address"
                    required
                    value={customer.address}
                    onChange={handleChange}
                    className="w-full border border-neutral-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    required
                    value={customer.city}
                    onChange={handleChange}
                    className="w-full border border-neutral-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Postal / Zip Code
                  </label>
                  <input
                    type="text"
                    name="postalCode"
                    value={customer.postalCode}
                    onChange={handleChange}
                    className="w-full border border-neutral-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="border border-neutral-200 rounded-xl p-6 bg-white space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-900">
                2. Payment Method
              </h2>

              <div className="space-y-3">
                <label className="flex items-center space-x-3 p-3.5 border rounded-lg cursor-pointer hover:border-black transition">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === "cod"}
                    onChange={() => setPaymentMethod("cod")}
                    className="h-4 w-4 text-black focus:ring-black"
                  />
                  <div>
                    <span className="text-sm font-medium text-neutral-900 block">
                      Cash on Delivery (COD)
                    </span>
                    <span className="text-xs text-neutral-500">
                      Pay with cash upon package receipt at your door.
                    </span>
                  </div>
                </label>

                <label className="flex items-center space-x-3 p-3.5 border rounded-lg cursor-pointer hover:border-black transition">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="card"
                    checked={paymentMethod === "card"}
                    onChange={() => setPaymentMethod("card")}
                    className="h-4 w-4 text-black focus:ring-black"
                  />
                  <div>
                    <span className="text-sm font-medium text-neutral-900 block">
                      Online Debit / Credit Card
                    </span>
                    <span className="text-xs text-neutral-500">
                      Direct payment processing via backend payment gateway.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Error notice if backend submission fails */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-800 text-xs">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-semibold">Backend Order Error:</strong>
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 bg-black text-white text-xs uppercase tracking-widest font-semibold py-4 rounded hover:bg-neutral-800 disabled:bg-neutral-400 transition"
            >
              <Lock size={15} />
              <span>
                {submitting
                  ? "Submitting to Backend..."
                  : `Place Order &bull; $${total.toFixed(2)}`}
              </span>
            </button>
          </form>
        </div>

        {/* Order Items Review Sidebar */}
        <div className="lg:col-span-5">
          <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-6 space-y-5 sticky top-24">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-900 border-b border-neutral-200 pb-3">
              Items in Order ({cart.length})
            </h3>

            <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
              {cart.map((item) => (
                <div key={item.id} className="flex gap-3 text-xs items-center">
                  <div className="relative w-14 h-16 bg-neutral-200 rounded overflow-hidden shrink-0">
                    {item.image && (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-neutral-900 truncate">
                      {item.name}
                    </p>
                    <p className="text-neutral-500">
                      Size: {item.size} &bull; Qty: {item.quantity}
                    </p>
                  </div>
                  <span className="font-semibold text-neutral-900">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-neutral-200 pt-4 space-y-2 text-xs text-neutral-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-neutral-900 font-medium">
                  ${subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}</span>
              </div>
            </div>

            <div className="border-t border-neutral-200 pt-3 flex justify-between items-center text-sm font-semibold text-neutral-900">
              <span>Total Payable</span>
              <span className="text-base">${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
