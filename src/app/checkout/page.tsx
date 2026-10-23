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
  Sparkles,
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

interface SavedCard {
  _id?: string;
  id?: string;
  cardHolder: string;
  cardType: string;
  last4: string;
  expiry: string;
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

  const [paymentMethod, setPaymentMethod] = useState<"cod" | "card" | "stripe">("cod");

  // Card payment details
  const [cardDetails, setCardDetails] = useState({
    cardHolder: "",
    cardNumber: "",
    expiry: "",
    cvc: "",
  });

  // Saved profile data
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderComplete, setOrderComplete] = useState<{
    orderId?: string | number;
    message?: string;
  } | null>(null);

  const shipping = subtotal >= 75 || subtotal === 0 ? 0 : 10;
  const total = subtotal + shipping;

  // Auto-fill from user profile when logged in
  useEffect(() => {
    let isCancelled = false;

    if (user) {
      setCustomer((prev) => ({
        ...prev,
        fullName: prev.fullName || user.name || "",
        email: prev.email || user.email || "",
      }));

      // Fetch saved profile addresses and cards
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
              // Pre-fill with default address if fields are empty
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

            if (data.user.paymentMethods && data.user.paymentMethods.length > 0) {
              setSavedCards(data.user.paymentMethods);
              const defaultCard =
                data.user.paymentMethods.find((c: SavedCard) => c.isDefault) ||
                data.user.paymentMethods[0];
              if (defaultCard) {
                setCardDetails((prev) => ({
                  ...prev,
                  cardHolder: prev.cardHolder || defaultCard.cardHolder || "",
                  expiry: prev.expiry || defaultCard.expiry || "",
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

    // Validate card details if card chosen
    if (paymentMethod === "card") {
      const cleanCard = cardDetails.cardNumber.replace(/\s+/g, "");
      if (cleanCard.length < 12) {
        setError("Please enter a valid 16-digit card number.");
        return;
      }
      if (!cardDetails.expiry || !cardDetails.cardHolder) {
        setError("Please complete all card details (Cardholder, Number, Expiry).");
        return;
      }
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
      cardDetails:
        paymentMethod === "card"
          ? {
              cardHolder: cardDetails.cardHolder || customer.fullName,
              cardNumber: cardDetails.cardNumber,
              expiry: cardDetails.expiry,
            }
          : undefined,
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
          .
        </p>

        {/* Profile Auto-Sync Banner */}
        <div className="mt-6 p-4 max-w-md mx-auto bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-700 flex items-center gap-2.5 text-left">
          <Sparkles size={18} className="text-black shrink-0" />
          <span>
            Your delivery address {paymentMethod === "card" && "and payment card"}{" "}
            have been automatically saved to your{" "}
            <Link href="/profile" className="font-semibold underline text-black">
              Profile Tabs
            </Link>{" "}
            for future 1-click orders.
          </span>
        </div>

        <div className="mt-8 border-t border-neutral-200 pt-8 flex flex-col sm:flex-row justify-center gap-4">
          <Link
            href="/profile"
            className="border border-neutral-300 text-neutral-900 text-xs uppercase tracking-widest font-semibold px-6 py-3.5 rounded hover:bg-neutral-50 transition"
          >
            View in Profile
          </Link>
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
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-900">
                  1. Contact &amp; Shipping Address
                </h2>
                {savedAddresses.length > 0 && (
                  <span className="text-[11px] text-neutral-500 flex items-center gap-1">
                    <MapPin size={12} /> Auto-synced with Profile
                  </span>
                )}
              </div>

              {/* Saved Address Quick Select */}
              {savedAddresses.length > 0 && (
                <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg">
                  <label htmlFor="checkout-saved-address" className="block text-[11px] font-medium text-neutral-600 mb-1 cursor-pointer">
                    Select a Saved Address:
                  </label>
                  <select
                    id="checkout-saved-address"
                    name="savedAddress"
                    autoComplete="off"
                    onChange={(e) => handleSelectSavedAddress(e.target.value)}
                    className="w-full bg-white border border-neutral-300 rounded px-2.5 py-1.5 text-xs text-neutral-800 focus:outline-none focus:ring-1 focus:ring-black"
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
                  <label htmlFor="checkout-fullname" className="block text-xs font-medium text-neutral-700 mb-1 cursor-pointer">
                    Full Name *
                  </label>
                  <input
                    id="checkout-fullname"
                    type="text"
                    name="fullName"
                    autoComplete="name"
                    required
                    value={customer.fullName}
                    onChange={handleChange}
                    className="w-full border border-neutral-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>

                <div>
                  <label htmlFor="checkout-email" className="block text-xs font-medium text-neutral-700 mb-1 cursor-pointer">
                    Email Address *
                  </label>
                  <input
                    id="checkout-email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    required
                    value={customer.email}
                    onChange={handleChange}
                    className="w-full border border-neutral-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>

                <div>
                  <label htmlFor="checkout-phone" className="block text-xs font-medium text-neutral-700 mb-1 cursor-pointer">
                    Phone Number *
                  </label>
                  <input
                    id="checkout-phone"
                    type="tel"
                    name="phone"
                    autoComplete="tel"
                    required
                    value={customer.phone}
                    onChange={handleChange}
                    placeholder="+92 300 1234567"
                    className="w-full border border-neutral-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="checkout-address" className="block text-xs font-medium text-neutral-700 mb-1 cursor-pointer">
                    Street Address *
                  </label>
                  <input
                    id="checkout-address"
                    type="text"
                    name="address"
                    autoComplete="street-address"
                    required
                    value={customer.address}
                    onChange={handleChange}
                    placeholder="House / Street / Area"
                    className="w-full border border-neutral-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>

                <div>
                  <label htmlFor="checkout-city" className="block text-xs font-medium text-neutral-700 mb-1 cursor-pointer">
                    City *
                  </label>
                  <input
                    id="checkout-city"
                    type="text"
                    name="city"
                    autoComplete="address-level2"
                    required
                    value={customer.city}
                    onChange={handleChange}
                    placeholder="Karachi, Lahore..."
                    className="w-full border border-neutral-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>

                <div>
                  <label htmlFor="checkout-postal-code" className="block text-xs font-medium text-neutral-700 mb-1 cursor-pointer">
                    Postal / Zip Code
                  </label>
                  <input
                    id="checkout-postal-code"
                    type="text"
                    name="postalCode"
                    autoComplete="postal-code"
                    value={customer.postalCode}
                    onChange={handleChange}
                    placeholder="75500"
                    className="w-full border border-neutral-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
              </div>

              <p className="text-[11px] text-neutral-400 pt-1">
                &bull; Entering a new address automatically saves it to your Profile Address Tab.
              </p>
            </div>

            {/* Payment Method */}
            <div className="border border-neutral-200 rounded-xl p-6 bg-white space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-900">
                2. Payment Method
              </h2>

              <div className="space-y-3">
                {/* Cash on Delivery */}
                <label htmlFor="payment-method-cod" className="flex items-center space-x-3 p-3.5 border rounded-lg cursor-pointer hover:border-black transition">
                  <input
                    id="payment-method-cod"
                    type="radio"
                    name="paymentMethod"
                    autoComplete="off"
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

                {/* Online Debit / Credit Card */}
                <label htmlFor="payment-method-card" className="flex items-center space-x-3 p-3.5 border rounded-lg cursor-pointer hover:border-black transition">
                  <input
                    id="payment-method-card"
                    type="radio"
                    name="paymentMethod"
                    autoComplete="off"
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
                      Encrypted card checkout. Automatically saved to Profile Payment Tab.
                    </span>
                  </div>
                </label>

                {/* Card input subform when Card chosen */}
                {paymentMethod === "card" && (
                  <div className="mt-3 p-4 bg-neutral-50 border border-neutral-200 rounded-lg space-y-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-neutral-800">
                      <CreditCard size={15} />
                      <span>Card Details</span>
                    </div>

                    {/* Quick Select from Saved Cards */}
                    {savedCards.length > 0 && (
                      <div className="pb-2">
                        <label htmlFor="checkout-saved-card" className="block text-[11px] font-medium text-neutral-600 mb-1 cursor-pointer">
                          Use a Saved Card:
                        </label>
                        <select
                          id="checkout-saved-card"
                          name="savedCard"
                          autoComplete="off"
                          onChange={(e) => {
                            const chosen = savedCards.find(
                              (c) => (c._id || c.id) === e.target.value
                            );
                            if (chosen) {
                              setCardDetails({
                                ...cardDetails,
                                cardHolder: chosen.cardHolder,
                                expiry: chosen.expiry,
                                cardNumber: `•••• •••• •••• ${chosen.last4}`,
                              });
                            }
                          }}
                          className="w-full bg-white border border-neutral-300 rounded px-2.5 py-1.5 text-xs text-neutral-800"
                        >
                          <option value="">-- Or enter new card details below --</option>
                          {savedCards.map((c) => (
                            <option key={c._id || c.id} value={c._id || c.id}>
                              {c.cardType} ending in {c.last4} ({c.cardHolder})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <label htmlFor="checkout-cardholder" className="block text-[11px] font-medium text-neutral-600 mb-1 cursor-pointer">
                        Name on Card *
                      </label>
                      <input
                        id="checkout-cardholder"
                        name="cardHolder"
                        type="text"
                        autoComplete="cc-name"
                        required={paymentMethod === "card"}
                        value={cardDetails.cardHolder || customer.fullName}
                        onChange={(e) =>
                          setCardDetails({ ...cardDetails, cardHolder: e.target.value })
                        }
                        placeholder="AHMED KHAN"
                        className="w-full bg-white border border-neutral-300 rounded px-3 py-2 text-xs uppercase font-medium focus:outline-none focus:ring-1 focus:ring-black"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2 sm:col-span-1">
                        <label htmlFor="checkout-cardnumber" className="block text-[11px] font-medium text-neutral-600 mb-1 cursor-pointer">
                          Card Number *
                        </label>
                        <input
                          id="checkout-cardnumber"
                          name="cardNumber"
                          type="text"
                          autoComplete="cc-number"
                          required={paymentMethod === "card"}
                          maxLength={19}
                          value={cardDetails.cardNumber}
                          onChange={(e) =>
                            setCardDetails({ ...cardDetails, cardNumber: e.target.value })
                          }
                          placeholder="4242 •••• •••• 4242"
                          className="w-full bg-white border border-neutral-300 rounded px-3 py-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-black"
                        />
                      </div>

                      <div className="col-span-1">
                        <label htmlFor="checkout-expiry" className="block text-[11px] font-medium text-neutral-600 mb-1 cursor-pointer">
                          Expires (MM/YY) *
                        </label>
                        <input
                          id="checkout-expiry"
                          name="expiry"
                          type="text"
                          autoComplete="cc-exp"
                          required={paymentMethod === "card"}
                          maxLength={5}
                          value={cardDetails.expiry}
                          onChange={(e) =>
                            setCardDetails({ ...cardDetails, expiry: e.target.value })
                          }
                          placeholder="12/28"
                          className="w-full bg-white border border-neutral-300 rounded px-3 py-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-black"
                        />
                      </div>

                      <div className="col-span-1">
                        <label htmlFor="checkout-cvc" className="block text-[11px] font-medium text-neutral-600 mb-1 cursor-pointer">
                          CVC / CVV
                        </label>
                        <input
                          id="checkout-cvc"
                          name="cvc"
                          type="password"
                          autoComplete="cc-csc"
                          maxLength={4}
                          value={cardDetails.cvc}
                          onChange={(e) =>
                            setCardDetails({ ...cardDetails, cvc: e.target.value })
                          }
                          placeholder="123"
                          className="w-full bg-white border border-neutral-300 rounded px-3 py-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-black"
                        />
                      </div>
                    </div>
                  </div>
                )}
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
                        sizes="56px"
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
