"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { createOrder } from "@/lib/api";
import { OrderCustomer, OrderPayload } from "@/types";
import {
  CheckCircle2,
  Lock,
  ArrowLeft,
  AlertCircle,
  CreditCard,
  MapPin,
  ShieldCheck,
  Truck,
  Building2,
  Phone,
  Mail,
  User as UserIcon,
  Banknote,
  Check,
} from "lucide-react";

interface SavedAddress {
  _id?: string;
  id?: string;
  label: string;
  recipientName: string;
  phone: string;
  street: string;
  apartment?: string;
  city: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export default function CheckoutPage() {
  const { cart, subtotal, clearCart } = useCart();
  const { user } = useAuth();

  const [customer, setCustomer] = useState<OrderCustomer>({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    country: "Pakistan",
  });

  // Default to Stripe as requested
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "stripe">("stripe");

  // Saved profile data
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [verifyingSession, setVerifyingSession] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderComplete, setOrderComplete] = useState<{
    orderId?: string | number;
    message?: string;
  } | null>(null);

  const shipping = subtotal >= 75 || subtotal === 0 ? 0 : 10;
  const total = subtotal + shipping;
  const freeShippingThreshold = 75;
  const amountToFreeShipping = Math.max(0, freeShippingThreshold - subtotal);

  // Check if returning from Stripe Checkout Session
  useEffect(() => {
    if (typeof window === "undefined") return;
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get("session_id");
    const wasCanceled = urlParams.get("canceled");

    if (wasCanceled) {
      window.history.replaceState({}, "", "/checkout");
      setError("Stripe payment was cancelled. You can choose another payment method or try again.");
      return;
    }

    if (sessionId) {
      // Immediately wipe the session_id from the browser address bar
      window.history.replaceState({}, "", "/checkout");
      setVerifyingSession(true);

      fetch(`/api/checkout/stripe?session_id=${encodeURIComponent(sessionId)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.paid) {
            setOrderComplete({
              orderId: data.orderNumber || "TC-STRIPE",
              message: "Payment successfully verified via Stripe Dashboard!",
            });
            clearCart();
          } else {
            setError(data.error || "Payment verification pending or incomplete.");
          }
        })
        .catch(() => {
          setError("Failed to verify Stripe payment session.");
        })
        .finally(() => {
          setVerifyingSession(false);
        });
    }
  }, [clearCart]);

  // Auto-fill from user profile when logged in
  useEffect(() => {
    let isCancelled = false;

    if (user) {
      setCustomer((prev) => ({
        ...prev,
        fullName: prev.fullName || user.name || "",
        email: prev.email || user.email || "",
      }));

      // Fetch saved profile addresses
      fetch("/api/user/profile")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!isCancelled && data?.user) {
            if (data.user.phone) {
              setCustomer((prev) => ({
                ...prev,
                phone: prev.phone || data.user.phone,
              }));
            }

            if (data.user.addresses && data.user.addresses.length > 0) {
              setSavedAddresses(data.user.addresses);
              const defaultAddr =
                data.user.addresses.find((a: SavedAddress) => a.isDefault) ||
                data.user.addresses[0];

              if (defaultAddr) {
                setCustomer((prev) => ({
                  ...prev,
                  fullName: prev.fullName || defaultAddr.recipientName || user.name,
                  phone: prev.phone || defaultAddr.phone || "",
                  address: prev.address || defaultAddr.street || "",
                  city: prev.city || defaultAddr.city || "",
                  postalCode: prev.postalCode || defaultAddr.postalCode || "",
                  country: prev.country || defaultAddr.country || "Pakistan",
                }));
              }
            }
          }
        })
        .catch(() => {});
    }

    return () => {
      isCancelled = true;
    };
  }, [user]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setCustomer({ ...customer, [e.target.name]: e.target.value });
  };

  const handleSelectSavedAddress = (addressId: string) => {
    const selected = savedAddresses.find(
      (a) => (a._id || a.id) === addressId
    );
    if (selected) {
      setCustomer({
        ...customer,
        fullName: selected.recipientName,
        phone: selected.phone,
        address: selected.street,
        city: selected.city,
        postalCode: selected.postalCode || "",
        country: selected.country || "Pakistan",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    // Validate delivery details
    if (
      !customer.fullName.trim() ||
      !customer.email.trim() ||
      !customer.phone.trim() ||
      !customer.address.trim() ||
      !customer.city.trim()
    ) {
      setError("Please complete all shipping address fields (Name, Email, Phone, Street, City).");
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

    if (paymentMethod === "stripe") {
      try {
        const stripeRes = await fetch("/api/checkout/stripe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const stripeData = await stripeRes.json();
        if (stripeData.success && stripeData.url) {
          window.location.href = stripeData.url;
          return;
        } else {
          setError(stripeData.error || "Failed to initialize Stripe checkout.");
          setSubmitting(false);
          return;
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Error connecting to Stripe.");
        setSubmitting(false);
        return;
      }
    }

    // Cash on delivery direct order submission
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

  if (verifyingSession) {
    return (
      <div className="max-w-xl mx-auto px-4 py-28 text-center">
        <div className="w-12 h-12 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin mx-auto mb-5" />
        <span className="text-[11px] font-mono uppercase tracking-widest text-neutral-500">
          Payment Processed
        </span>
        <h1 className="font-serif text-2xl font-bold tracking-tight text-neutral-950 mt-1">
          Finalizing your order...
        </h1>
        <p className="text-xs text-neutral-400 mt-2">
          Please wait a moment while your order confirmation is generated.
        </p>
      </div>
    );
  }

  if (orderComplete) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 bg-neutral-950 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-md">
          <CheckCircle2 size={34} />
        </div>
        <span className="text-[11px] font-mono uppercase tracking-widest text-neutral-500">
          Order Successfully Placed
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-neutral-950 mt-2">
          Thank you for your order
        </h1>
        <p className="text-sm text-neutral-600 mt-3">
          Your order identifier is{" "}
          <strong className="text-neutral-950 font-mono text-base">
            #{orderComplete.orderId}
          </strong>
        </p>

        <div className="mt-8 border-t border-neutral-200/80 pt-8 flex flex-col sm:flex-row justify-center gap-3">
          <Link
            href="/profile"
            className="border border-neutral-300 text-neutral-900 text-xs uppercase tracking-widest font-semibold px-6 py-3.5 rounded-lg hover:bg-neutral-50 transition"
          >
            View in Profile
          </Link>
          <Link
            href="/shop"
            className="bg-neutral-950 text-white text-xs uppercase tracking-widest font-semibold px-8 py-3.5 rounded-lg hover:bg-neutral-800 transition"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <div className="w-14 h-14 bg-neutral-100 text-neutral-400 rounded-full flex items-center justify-center mx-auto mb-4">
          <Truck size={24} />
        </div>
        <h2 className="font-serif text-2xl font-bold text-neutral-950">
          Your bag is currently empty
        </h2>
        <p className="text-xs text-neutral-500 mt-2 max-w-sm mx-auto">
          Add studio essentials or garments to your shopping bag before proceeding to checkout.
        </p>
        <Link
          href="/shop"
          className="inline-block mt-6 bg-neutral-950 text-white text-xs uppercase tracking-widest font-semibold px-8 py-3.5 rounded-lg hover:bg-neutral-800 transition"
        >
          Explore Collection
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-neutral-50/40 min-h-screen py-10 sm:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Breadcrumb / Return Link */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-8 mb-8 border-b border-neutral-200/80 gap-4">
          <div>
            <Link
              href="/cart"
              className="inline-flex items-center gap-2 text-xs font-medium text-neutral-500 hover:text-neutral-950 transition group"
            >
              <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
              <span>Return to Shopping Bag</span>
            </Link>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950 mt-2">
              Express Checkout
            </h1>
          </div>

          <div className="flex items-center gap-2 text-xs text-neutral-500 font-medium">
            <ShieldCheck size={16} className="text-emerald-700" />
            <span>256-Bit SSL Encrypted & Secure</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Main Checkout Form Column */}
          <div className="lg:col-span-7">
            <form id="checkout-form" name="checkoutForm" onSubmit={handleSubmit} className="space-y-6">
              {/* Delivery Details Card */}
              <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 sm:p-7 shadow-xs space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-neutral-950 text-white text-xs font-mono flex items-center justify-center font-bold">
                      1
                    </span>
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-900">
                      Delivery Address
                    </h2>
                  </div>
                  {savedAddresses.length > 0 && (
                    <span className="text-[11px] text-neutral-500 flex items-center gap-1">
                      <MapPin size={12} className="text-neutral-400" /> Saved addresses available
                    </span>
                  )}
                </div>

                {/* Quick Select from Saved Addresses */}
                {savedAddresses.length > 0 && (
                  <div className="p-3.5 bg-neutral-50 border border-neutral-200 rounded-xl">
                    <label htmlFor="checkout-saved-address" className="block text-xs font-medium text-neutral-700 mb-1.5 cursor-pointer">
                      Use a Saved Address:
                    </label>
                    <select
                      id="checkout-saved-address"
                      name="savedAddress"
                      autoComplete="off"
                      onChange={(e) => handleSelectSavedAddress(e.target.value)}
                      className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs text-neutral-800 focus:outline-none focus:ring-1 focus:ring-black"
                    >
                      <option value="">-- Choose from your saved addresses --</option>
                      {savedAddresses.map((addr) => (
                        <option key={addr._id || addr.id} value={addr._id || addr.id}>
                          {addr.label}: {addr.recipientName} - {addr.street}, {addr.city}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label htmlFor="checkout-fullname" className="block text-xs font-medium text-neutral-700 mb-1.5 cursor-pointer">
                      Recipient Full Name *
                    </label>
                    <div className="relative">
                      <input
                        id="checkout-fullname"
                        type="text"
                        name="fullName"
                        autoComplete="name"
                        required
                        value={customer.fullName}
                        onChange={handleChange}
                        placeholder="John Doe"
                        className="w-full border border-neutral-300 rounded-lg pl-9 pr-3 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition"
                      />
                      <UserIcon size={15} className="absolute left-3 top-3 text-neutral-400" />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="checkout-email" className="block text-xs font-medium text-neutral-700 mb-1.5 cursor-pointer">
                      Email Address (for Receipt) *
                    </label>
                    <div className="relative">
                      <input
                        id="checkout-email"
                        type="email"
                        name="email"
                        autoComplete="email"
                        required
                        value={customer.email}
                        onChange={handleChange}
                        placeholder="john@example.com"
                        className="w-full border border-neutral-300 rounded-lg pl-9 pr-3 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition"
                      />
                      <Mail size={15} className="absolute left-3 top-3 text-neutral-400" />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="checkout-phone" className="block text-xs font-medium text-neutral-700 mb-1.5 cursor-pointer">
                      Phone Number *
                    </label>
                    <div className="relative">
                      <input
                        id="checkout-phone"
                        type="tel"
                        name="phone"
                        autoComplete="tel"
                        required
                        value={customer.phone}
                        onChange={handleChange}
                        placeholder="+92 300 1234567"
                        className="w-full border border-neutral-300 rounded-lg pl-9 pr-3 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition"
                      />
                      <Phone size={15} className="absolute left-3 top-3 text-neutral-400" />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="checkout-address" className="block text-xs font-medium text-neutral-700 mb-1.5 cursor-pointer">
                      Street Address &amp; House Number *
                    </label>
                    <div className="relative">
                      <input
                        id="checkout-address"
                        type="text"
                        name="address"
                        autoComplete="street-address"
                        required
                        value={customer.address}
                        onChange={handleChange}
                        placeholder="House / Apartment, Street, Area"
                        className="w-full border border-neutral-300 rounded-lg pl-9 pr-3 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition"
                      />
                      <MapPin size={15} className="absolute left-3 top-3 text-neutral-400" />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="checkout-city" className="block text-xs font-medium text-neutral-700 mb-1.5 cursor-pointer">
                      City *
                    </label>
                    <div className="relative">
                      <input
                        id="checkout-city"
                        type="text"
                        name="city"
                        autoComplete="address-level2"
                        required
                        value={customer.city}
                        onChange={handleChange}
                        placeholder="Lahore, Karachi, Islamabad..."
                        className="w-full border border-neutral-300 rounded-lg pl-9 pr-3 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition"
                      />
                      <Building2 size={15} className="absolute left-3 top-3 text-neutral-400" />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="checkout-postal-code" className="block text-xs font-medium text-neutral-700 mb-1.5 cursor-pointer">
                      Postal / Zip Code
                    </label>
                    <input
                      id="checkout-postal-code"
                      type="text"
                      name="postalCode"
                      autoComplete="postal-code"
                      value={customer.postalCode}
                      onChange={handleChange}
                      placeholder="54000"
                      className="w-full border border-neutral-300 rounded-lg px-3 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method Card */}
              <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 sm:p-7 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-neutral-950 text-white text-xs font-mono flex items-center justify-center font-bold">
                      2
                    </span>
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-900">
                      Payment Method
                    </h2>
                  </div>
                  <span className="text-[11px] text-neutral-500 font-medium">
                    Secure &amp; Encrypted
                  </span>
                </div>

                <div className="space-y-3 pt-1">
                  {/* Option 1: Stripe (Primary & Default) */}
                  <label
                    htmlFor="payment-method-stripe"
                    className={`block relative border rounded-xl p-4 cursor-pointer transition ${
                      paymentMethod === "stripe"
                        ? "border-neutral-950 bg-neutral-50/60 ring-1 ring-neutral-950"
                        : "border-neutral-200 hover:border-neutral-400 bg-white"
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <input
                        id="payment-method-stripe"
                        type="radio"
                        name="paymentMethod"
                        autoComplete="off"
                        value="stripe"
                        checked={paymentMethod === "stripe"}
                        onChange={() => setPaymentMethod("stripe")}
                        className="mt-1 h-4 w-4 text-black focus:ring-black accent-black"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span className="text-sm font-semibold text-neutral-950 flex items-center gap-2">
                            <span>Stripe Secure Payment</span>
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-neutral-950 text-white">
                              Recommended
                            </span>
                          </span>

                          <div className="flex items-center gap-1.5 text-neutral-600">
                            <CreditCard size={18} />
                            <span className="text-[11px] font-mono font-medium">Cards &bull; Apple/Google Pay</span>
                          </div>
                        </div>

                        <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                          Pay instantly via official Stripe Dashboard. Supports Visa, Mastercard, American Express, Apple Pay &amp; Google Pay.
                        </p>
                      </div>
                    </div>
                  </label>

                  {/* Option 2: Cash on Delivery (COD) */}
                  <label
                    htmlFor="payment-method-cod"
                    className={`block relative border rounded-xl p-4 cursor-pointer transition ${
                      paymentMethod === "cod"
                        ? "border-neutral-950 bg-neutral-50/60 ring-1 ring-neutral-950"
                        : "border-neutral-200 hover:border-neutral-400 bg-white"
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <input
                        id="payment-method-cod"
                        type="radio"
                        name="paymentMethod"
                        autoComplete="off"
                        value="cod"
                        checked={paymentMethod === "cod"}
                        onChange={() => setPaymentMethod("cod")}
                        className="mt-1 h-4 w-4 text-black focus:ring-black accent-black"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span className="text-sm font-semibold text-neutral-950 flex items-center gap-2">
                            <span>Cash on Delivery (COD)</span>
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-neutral-200 text-neutral-800">
                              Pay on Delivery
                            </span>
                          </span>

                          <div className="flex items-center gap-1.5 text-neutral-600">
                            <Banknote size={18} />
                          </div>
                        </div>

                        <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                          Pay with cash to the courier when your order is delivered to your doorstep.
                        </p>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Error Notice */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Action Button */}
              <button
                id="checkout-submit-btn"
                name="checkoutSubmit"
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2.5 bg-neutral-950 text-white text-xs uppercase tracking-widest font-semibold py-4 rounded-xl hover:bg-neutral-800 disabled:bg-neutral-300 disabled:cursor-not-allowed transition shadow-md"
              >
                <Lock size={15} />
                <span>
                  {submitting
                    ? paymentMethod === "stripe"
                      ? "Connecting to Stripe Dashboard..."
                      : "Placing Order..."
                    : paymentMethod === "stripe"
                    ? `Proceed to Stripe Payment &bull; $${total.toFixed(2)}`
                    : `Confirm Cash on Delivery Order &bull; $${total.toFixed(2)}`}
                </span>
              </button>
            </form>
          </div>

          {/* Sticky Order Review Sidebar */}
          <div className="lg:col-span-5">
            <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 sm:p-7 shadow-xs space-y-6 sticky top-24">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-900">
                  Order Summary ({cart.length} {cart.length === 1 ? "item" : "items"})
                </h3>
                <Link
                  href="/cart"
                  className="text-xs text-neutral-500 hover:text-black underline transition"
                >
                  Edit Bag
                </Link>
              </div>

              {/* Free shipping progress indicator */}
              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/80 text-xs">
                {subtotal >= freeShippingThreshold ? (
                  <div className="flex items-center gap-1.5 text-emerald-800 font-medium">
                    <Check size={14} className="stroke-[2.5]" />
                    <span>You unlocked Complimentary Free Shipping!</span>
                  </div>
                ) : (
                  <div className="text-neutral-600">
                    Add <strong className="text-neutral-950 font-mono">${amountToFreeShipping.toFixed(2)}</strong> more for Free Shipping.
                  </div>
                )}
              </div>

              {/* Items List */}
              <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div key={item.id} className="flex gap-3 text-xs items-center justify-between">
                    <div className="flex gap-3 items-center min-w-0">
                      <div className="relative w-12 h-14 bg-neutral-100 rounded-lg overflow-hidden shrink-0 border border-neutral-200/60">
                        {item.image && (
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-neutral-900 truncate">
                          {item.name}
                        </p>
                        <p className="text-[11px] text-neutral-500 mt-0.5">
                          Size: {item.size} {item.color && `&bull; Color: ${item.color}`} &bull; Qty: {item.quantity}
                        </p>
                      </div>
                    </div>
                    <span className="font-semibold text-neutral-950 shrink-0">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t border-neutral-100 pt-4 space-y-2.5 text-xs text-neutral-600">
                <div className="flex justify-between">
                  <span>Cart Subtotal</span>
                  <span className="text-neutral-950 font-medium">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Standard Shipping</span>
                  <span className={shipping === 0 ? "text-emerald-700 font-medium" : "text-neutral-950"}>
                    {shipping === 0 ? "FREE" : `$${shipping.toFixed(2)}`}
                  </span>
                </div>
              </div>

              <div className="border-t border-neutral-200/80 pt-4 flex justify-between items-center text-sm font-semibold text-neutral-950">
                <span>Total Amount</span>
                <span className="font-serif text-xl font-bold">${total.toFixed(2)}</span>
              </div>

              {/* Guarantees */}
              <div className="border-t border-neutral-100 pt-4 space-y-2 text-[11px] text-neutral-500">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={14} className="text-neutral-700 shrink-0" />
                  <span>Official ThreadCraft studio quality guarantee</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck size={14} className="text-neutral-700 shrink-0" />
                  <span>Tracked courier delivery with live SMS updates</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
