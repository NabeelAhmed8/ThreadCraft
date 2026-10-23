"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import {
  User as UserIcon,
  MapPin,
  CreditCard,
  Package,
  ShieldCheck,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Phone,
  Mail,
  Lock,
  LogOut,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

interface Address {
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

interface PaymentMethod {
  _id?: string;
  id?: string;
  cardHolder: string;
  cardType: string;
  last4: string;
  expiry: string;
  isDefault: boolean;
}

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  image: string;
  size: string;
  color?: string;
  quantity: number;
}

interface Order {
  _id?: string;
  id?: string;
  orderNumber: string;
  createdAt: string;
  total: number;
  orderStatus: string;
  paymentMethod: string;
  items: OrderItem[];
}

export default function ProfilePage() {
  const { user, logout, isAuthenticated } = useAuth();

  const [activeTab, setActiveTab] = useState<
    "profile" | "addresses" | "payments" | "orders" | "security"
  >("profile");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Profile data states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [createdAt, setCreatedAt] = useState("");

  // Addresses & Payments
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [payments, setPayments] = useState<PaymentMethod[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Modal / Form toggle states
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: "Home",
    recipientName: "",
    phone: "",
    street: "",
    apartment: "",
    city: "",
    postalCode: "",
    country: "Pakistan",
    isDefault: false,
  });

  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [newPayment, setNewPayment] = useState({
    cardHolder: "",
    cardNumber: "",
    expiry: "",
    isDefault: false,
  });

  // Load profile and orders
  useEffect(() => {
    let isCancelled = false;

    const loadProfileData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Fetch User Profile with addresses & payments
        const profileRes = await fetch("/api/user/profile");
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          if (!isCancelled && profileData.user) {
            setName(profileData.user.name || "");
            setEmail(profileData.user.email || "");
            setPhone(profileData.user.phone || "");
            setIsVerified(profileData.user.isVerified || false);
            setCreatedAt(profileData.user.createdAt || "");
            setAddresses(profileData.user.addresses || []);
            setPayments(profileData.user.paymentMethods || []);
          }
        }

        // Fetch User Orders
        const ordersRes = await fetch(
          `/api/orders?email=${encodeURIComponent(user.email)}`
        );
        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          if (!isCancelled) {
            setOrders(ordersData.orders || []);
          }
        }
      } catch (err) {
        console.error("Error loading profile:", err);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    loadProfileData();

    return () => {
      isCancelled = true;
    };
  }, [user]);

  // Update Personal Info
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile.");

      setFeedback({ type: "success", message: "Profile updated successfully!" });
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to update profile.",
      });
    } finally {
      setSaving(false);
    }
  };

  // Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (newPassword !== confirmPassword) {
      setFeedback({ type: "error", message: "New passwords do not match." });
      return;
    }

    if (newPassword.length < 6) {
      setFeedback({
        type: "error",
        message: "Password must be at least 6 characters long.",
      });
      return;
    }

    setSaving(true);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Password change failed.");

      setFeedback({
        type: "success",
        message: "Password updated successfully! Please use it next time.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Password change failed.",
      });
    } finally {
      setSaving(false);
    }
  };

  // Add Address
  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/user/address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAddress),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save address.");

      setAddresses(data.addresses);
      setShowAddressForm(false);
      setNewAddress({
        label: "Home",
        recipientName: "",
        phone: "",
        street: "",
        apartment: "",
        city: "",
        postalCode: "",
        country: "Pakistan",
        isDefault: false,
      });
      setFeedback({ type: "success", message: "Address added successfully!" });
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to save address.",
      });
    } finally {
      setSaving(false);
    }
  };

  // Delete Address
  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm("Are you sure you want to remove this address?")) return;
    setFeedback(null);

    try {
      const res = await fetch("/api/user/address", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addressId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to remove address.");

      setAddresses(data.addresses);
      setFeedback({ type: "success", message: "Address removed." });
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to remove address.",
      });
    }
  };

  // Add Payment
  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/user/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPayment),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save payment card.");

      setPayments(data.paymentMethods);
      setShowPaymentForm(false);
      setNewPayment({
        cardHolder: "",
        cardNumber: "",
        expiry: "",
        isDefault: false,
      });
      setFeedback({
        type: "success",
        message: "Payment card saved securely!",
      });
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to save card.",
      });
    } finally {
      setSaving(false);
    }
  };

  // Delete Payment
  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm("Are you sure you want to remove this payment method?")) return;
    setFeedback(null);

    try {
      const res = await fetch("/api/user/payment", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to remove card.");

      setPayments(data.paymentMethods);
      setFeedback({ type: "success", message: "Payment method removed." });
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to remove card.",
      });
    }
  };

  // If user is not authenticated
  if (!isAuthenticated && !loading) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 bg-neutral-50/50">
        <div className="max-w-md w-full bg-white border border-neutral-200 rounded-2xl p-8 text-center space-y-5 shadow-xs">
          <div className="w-14 h-14 bg-neutral-100 rounded-full flex items-center justify-center mx-auto text-neutral-800">
            <UserIcon size={24} />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold text-neutral-950">
              Sign In to Your Account
            </h1>
            <p className="text-xs text-neutral-500 mt-1.5">
              Access your wardrobe profile, saved addresses, payment methods, and
              order tracking history.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/login"
              className="px-6 py-3 bg-black text-white text-xs uppercase tracking-wider font-semibold rounded-lg hover:bg-neutral-800 transition"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-6 py-3 border border-neutral-300 text-neutral-900 text-xs uppercase tracking-wider font-semibold rounded-lg hover:bg-neutral-50 transition"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50/50 py-6 sm:py-10 md:py-16">
      <div className="max-w-6xl mx-auto px-3.5 sm:px-6 lg:px-8">
        {/* Page Title & User Summary */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-4 sm:p-6 md:p-8 mb-6 sm:mb-8 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
          <div className="flex items-center gap-3.5 sm:gap-4 min-w-0 w-full sm:w-auto">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-neutral-900 text-white rounded-full flex items-center justify-center font-serif text-lg sm:text-2xl font-bold shrink-0">
              {name ? name.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-serif text-lg sm:text-2xl font-bold text-neutral-950 truncate max-w-47.5 sm:max-w-xs md:max-w-none">
                  {name || "Customer Account"}
                </h1>
                {isVerified ? (
                  <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0">
                    <ShieldCheck size={11} /> Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0">
                    Unverified
                  </span>
                )}
              </div>
              <div className="text-xs text-neutral-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="flex items-center gap-1.5 min-w-0">
                  <Mail size={12} className="shrink-0 text-neutral-400" />
                  <span className="truncate max-w-47.5 sm:max-w-none">{email}</span>
                </span>
                {phone && (
                  <span className="flex items-center gap-1.5 shrink-0">
                    <Phone size={12} className="shrink-0 text-neutral-400" />
                    <span>{phone}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="w-full sm:w-auto flex justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-neutral-100">
            <button
              onClick={logout}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 text-xs text-red-600 hover:text-red-700 border border-red-200 hover:bg-red-50 px-4 py-2 rounded-lg font-medium transition"
            >
              <LogOut size={13} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`mb-6 p-3.5 sm:p-4 rounded-xl flex items-center gap-2.5 text-xs ${
              feedback.type === "success"
                ? "bg-green-50 border border-green-200 text-green-800"
                : "bg-red-50 border border-red-200 text-red-800"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 size={16} className="shrink-0 text-green-600" />
            ) : (
              <AlertCircle size={16} className="shrink-0 text-red-600" />
            )}
            <span className="wrap-break-word">{feedback.message}</span>
          </div>
        )}

        {/* Main Content Layout: Tabs + Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Navigation Tabs Sidebar / Mobile Pill Bar */}
          <div className="lg:col-span-1">
            <nav className="bg-white border border-neutral-200 rounded-2xl p-1.5 sm:p-2 shadow-xs sticky top-20 lg:top-24 z-10 flex lg:flex-col gap-1 sm:gap-1.5 overflow-x-auto lg:overflow-visible no-scrollbar">
              <button
                onClick={() => {
                  setActiveTab("profile");
                  setFeedback(null);
                }}
                className={`shrink-0 lg:w-full flex items-center justify-between px-3.5 sm:px-4 py-2 sm:py-3 rounded-xl text-xs font-medium tracking-wide transition whitespace-nowrap ${
                  activeTab === "profile"
                    ? "bg-neutral-900 text-white shadow-xs"
                    : "text-neutral-600 hover:text-black hover:bg-neutral-50"
                }`}
              >
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <UserIcon size={15} />
                  <span>Personal Profile</span>
                </div>
                <ChevronRight size={14} className="opacity-50 hidden lg:block" />
              </button>

              <button
                onClick={() => {
                  setActiveTab("addresses");
                  setFeedback(null);
                }}
                className={`shrink-0 lg:w-full flex items-center justify-between px-3.5 sm:px-4 py-2 sm:py-3 rounded-xl text-xs font-medium tracking-wide transition whitespace-nowrap ${
                  activeTab === "addresses"
                    ? "bg-neutral-900 text-white shadow-xs"
                    : "text-neutral-600 hover:text-black hover:bg-neutral-50"
                }`}
              >
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <MapPin size={15} />
                  <span>Addresses ({addresses.length})</span>
                </div>
                <ChevronRight size={14} className="opacity-50 hidden lg:block" />
              </button>

              <button
                onClick={() => {
                  setActiveTab("payments");
                  setFeedback(null);
                }}
                className={`shrink-0 lg:w-full flex items-center justify-between px-3.5 sm:px-4 py-2 sm:py-3 rounded-xl text-xs font-medium tracking-wide transition whitespace-nowrap ${
                  activeTab === "payments"
                    ? "bg-neutral-900 text-white shadow-xs"
                    : "text-neutral-600 hover:text-black hover:bg-neutral-50"
                }`}
              >
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <CreditCard size={15} />
                  <span>Cards ({payments.length})</span>
                </div>
                <ChevronRight size={14} className="opacity-50 hidden lg:block" />
              </button>

              <button
                onClick={() => {
                  setActiveTab("orders");
                  setFeedback(null);
                }}
                className={`shrink-0 lg:w-full flex items-center justify-between px-3.5 sm:px-4 py-2 sm:py-3 rounded-xl text-xs font-medium tracking-wide transition whitespace-nowrap ${
                  activeTab === "orders"
                    ? "bg-neutral-900 text-white shadow-xs"
                    : "text-neutral-600 hover:text-black hover:bg-neutral-50"
                }`}
              >
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <Package size={15} />
                  <span>Orders ({orders.length})</span>
                </div>
                <ChevronRight size={14} className="opacity-50 hidden lg:block" />
              </button>

              <button
                onClick={() => {
                  setActiveTab("security");
                  setFeedback(null);
                }}
                className={`shrink-0 lg:w-full flex items-center justify-between px-3.5 sm:px-4 py-2 sm:py-3 rounded-xl text-xs font-medium tracking-wide transition whitespace-nowrap ${
                  activeTab === "security"
                    ? "bg-neutral-900 text-white shadow-xs"
                    : "text-neutral-600 hover:text-black hover:bg-neutral-50"
                }`}
              >
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <ShieldCheck size={15} />
                  <span>Security</span>
                </div>
                <ChevronRight size={14} className="opacity-50 hidden lg:block" />
              </button>
            </nav>
          </div>

          {/* Tab Content Panel */}
          <div className="lg:col-span-3">
            {/* 1. PERSONAL PROFILE TAB */}
            {activeTab === "profile" && (
              <div className="bg-white border border-neutral-200 rounded-2xl p-5 sm:p-6 md:p-8 shadow-xs space-y-6">
                <div>
                  <h2 className="font-serif text-lg sm:text-xl font-bold text-neutral-950">
                    Personal Information
                  </h2>
                  <p className="text-xs text-neutral-500 mt-1">
                    Manage your name, contact phone, and studio identity.
                  </p>
                </div>

                <form id="profile-info-form" name="profileInfoForm" onSubmit={handleUpdateProfile} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    <div>
                      <label htmlFor="profile-fullname" className="block text-xs font-medium text-neutral-700 uppercase tracking-wider mb-1.5 cursor-pointer">
                        Full Name
                      </label>
                      <input
                        id="profile-fullname"
                        name="name"
                        type="text"
                        autoComplete="name"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-white border border-neutral-300 rounded-lg py-2.5 px-3.5 text-sm text-neutral-900 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition"
                      />
                    </div>

                    <div>
                      <label htmlFor="profile-email" className="block text-xs font-medium text-neutral-700 uppercase tracking-wider mb-1.5 cursor-pointer">
                        Email Address (Permanent)
                      </label>
                      <input
                        id="profile-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        disabled
                        value={email}
                        className="w-full bg-neutral-100 border border-neutral-200 rounded-lg py-2.5 px-3.5 text-sm text-neutral-500 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="profile-phone" className="block text-xs font-medium text-neutral-700 uppercase tracking-wider mb-1.5 cursor-pointer">
                      Phone Number
                    </label>
                    <input
                      id="profile-phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+92 300 1234567"
                      className="w-full bg-white border border-neutral-300 rounded-lg py-2.5 px-3.5 text-sm text-neutral-900 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition"
                    />
                    <p className="text-[11px] text-neutral-400 mt-1">
                      Used for delivery updates and order receipts.
                    </p>
                  </div>

                  {createdAt && (
                    <div className="pt-2 text-xs text-neutral-400 font-mono">
                      Member since: {new Date(createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                  )}

                  <div className="pt-4 border-t border-neutral-100 flex justify-end">
                    <button
                      id="profile-save-btn"
                      name="saveProfile"
                      type="submit"
                      disabled={saving}
                      className="w-full sm:w-auto px-6 py-2.5 bg-neutral-950 text-white text-xs uppercase tracking-wider font-semibold rounded-lg hover:bg-neutral-800 disabled:bg-neutral-300 transition"
                    >
                      {saving ? "Saving Changes..." : "Save Profile"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* 2. ADDRESSES TAB */}
            {activeTab === "addresses" && (
              <div className="space-y-6">
                <div className="bg-white border border-neutral-200 rounded-2xl p-5 sm:p-6 md:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="font-serif text-lg sm:text-xl font-bold text-neutral-950">
                      Saved Delivery Addresses
                    </h2>
                    <p className="text-xs text-neutral-500 mt-1">
                      Save multiple delivery destinations for effortless checkout.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddressForm(!showAddressForm)}
                    className="self-start sm:self-auto flex items-center justify-center gap-1.5 bg-neutral-950 text-white text-xs uppercase tracking-wider font-semibold px-4 py-2.5 rounded-lg hover:bg-neutral-800 transition shrink-0"
                  >
                    <Plus size={15} />
                    <span>{showAddressForm ? "Cancel" : "Add Address"}</span>
                  </button>
                </div>

                {/* Add New Address Form */}
                {showAddressForm && (
                  <div className="bg-white border border-neutral-200 rounded-2xl p-5 sm:p-6 md:p-8 shadow-xs">
                    <h3 className="font-serif text-base font-bold text-neutral-900 mb-4">
                      Add New Shipping Address
                    </h3>
                    <form id="add-address-form" name="addAddressForm" onSubmit={handleAddAddress} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="address-tag" className="block text-xs font-medium text-neutral-700 uppercase tracking-wider mb-1 cursor-pointer">
                            Address Tag (e.g., Home, Studio)
                          </label>
                          <input
                            id="address-tag"
                            name="label"
                            type="text"
                            autoComplete="off"
                            value={newAddress.label}
                            onChange={(e) =>
                              setNewAddress({ ...newAddress, label: e.target.value })
                            }
                            placeholder="Home"
                            className="w-full bg-white border border-neutral-300 rounded-lg p-2.5 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-black"
                          />
                        </div>
                        <div>
                          <label htmlFor="address-recipient" className="block text-xs font-medium text-neutral-700 uppercase tracking-wider mb-1 cursor-pointer">
                            Recipient Full Name *
                          </label>
                          <input
                            id="address-recipient"
                            name="recipientName"
                            type="text"
                            autoComplete="name"
                            required
                            value={newAddress.recipientName}
                            onChange={(e) =>
                              setNewAddress({
                                ...newAddress,
                                recipientName: e.target.value,
                              })
                            }
                            placeholder="Recipient Name"
                            className="w-full bg-white border border-neutral-300 rounded-lg p-2.5 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-black"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="address-phone" className="block text-xs font-medium text-neutral-700 uppercase tracking-wider mb-1 cursor-pointer">
                            Contact Phone *
                          </label>
                          <input
                            id="address-phone"
                            name="phone"
                            type="tel"
                            autoComplete="tel"
                            required
                            value={newAddress.phone}
                            onChange={(e) =>
                              setNewAddress({ ...newAddress, phone: e.target.value })
                            }
                            placeholder="+92 300 1234567"
                            className="w-full bg-white border border-neutral-300 rounded-lg p-2.5 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-black"
                          />
                        </div>
                        <div>
                          <label htmlFor="address-city" className="block text-xs font-medium text-neutral-700 uppercase tracking-wider mb-1 cursor-pointer">
                            City *
                          </label>
                          <input
                            id="address-city"
                            name="city"
                            type="text"
                            autoComplete="address-level2"
                            required
                            value={newAddress.city}
                            onChange={(e) =>
                              setNewAddress({ ...newAddress, city: e.target.value })
                            }
                            placeholder="Karachi, Lahore, Islamabad..."
                            className="w-full bg-white border border-neutral-300 rounded-lg p-2.5 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-black"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="address-street" className="block text-xs font-medium text-neutral-700 uppercase tracking-wider mb-1 cursor-pointer">
                          Street Address *
                        </label>
                        <input
                          id="address-street"
                          name="street"
                          type="text"
                          autoComplete="street-address"
                          required
                          value={newAddress.street}
                          onChange={(e) =>
                            setNewAddress({ ...newAddress, street: e.target.value })
                          }
                          placeholder="House / Street / Area / Sector"
                          className="w-full bg-white border border-neutral-300 rounded-lg p-2.5 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-black"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label htmlFor="address-apartment" className="block text-xs font-medium text-neutral-700 uppercase tracking-wider mb-1 cursor-pointer">
                            Apt / Suite (Optional)
                          </label>
                          <input
                            id="address-apartment"
                            name="apartment"
                            type="text"
                            autoComplete="address-line2"
                            value={newAddress.apartment}
                            onChange={(e) =>
                              setNewAddress({
                                ...newAddress,
                                apartment: e.target.value,
                              })
                            }
                            placeholder="Flat 4B"
                            className="w-full bg-white border border-neutral-300 rounded-lg p-2.5 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-black"
                          />
                        </div>
                        <div>
                          <label htmlFor="address-postal" className="block text-xs font-medium text-neutral-700 uppercase tracking-wider mb-1 cursor-pointer">
                            Postal Code
                          </label>
                          <input
                            id="address-postal"
                            name="postalCode"
                            type="text"
                            autoComplete="postal-code"
                            value={newAddress.postalCode}
                            onChange={(e) =>
                              setNewAddress({
                                ...newAddress,
                                postalCode: e.target.value,
                              })
                            }
                            placeholder="75500"
                            className="w-full bg-white border border-neutral-300 rounded-lg p-2.5 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-black"
                          />
                        </div>
                        <div>
                          <label htmlFor="address-country" className="block text-xs font-medium text-neutral-700 uppercase tracking-wider mb-1 cursor-pointer">
                            Country
                          </label>
                          <input
                            id="address-country"
                            name="country"
                            type="text"
                            autoComplete="country-name"
                            value={newAddress.country}
                            onChange={(e) =>
                              setNewAddress({
                                ...newAddress,
                                country: e.target.value,
                              })
                            }
                            className="w-full bg-white border border-neutral-300 rounded-lg p-2.5 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-black"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <input
                          type="checkbox"
                          id="defaultAddr"
                          name="isDefault"
                          autoComplete="off"
                          checked={newAddress.isDefault}
                          onChange={(e) =>
                            setNewAddress({
                              ...newAddress,
                              isDefault: e.target.checked,
                            })
                          }
                          className="rounded border-neutral-300 text-black focus:ring-black"
                        />
                        <label
                          htmlFor="defaultAddr"
                          className="text-xs text-neutral-700 cursor-pointer"
                        >
                          Set as default shipping address
                        </label>
                      </div>

                      <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 sm:gap-3 pt-3">
                        <button
                          type="button"
                          onClick={() => setShowAddressForm(false)}
                          className="w-full sm:w-auto px-4 py-2.5 border border-neutral-300 text-xs font-medium text-neutral-700 rounded-lg hover:bg-neutral-50 transition"
                        >
                          Cancel
                        </button>
                        <button
                          id="address-save-btn"
                          name="saveAddress"
                          type="submit"
                          disabled={saving}
                          className="w-full sm:w-auto px-5 py-2.5 bg-black text-white text-xs uppercase tracking-wider font-semibold rounded-lg hover:bg-neutral-800 transition"
                        >
                          {saving ? "Saving..." : "Save Address"}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Addresses List */}
                {addresses.length === 0 ? (
                  <div className="bg-white border border-neutral-200 rounded-2xl p-8 sm:p-12 text-center shadow-xs">
                    <MapPin
                      size={32}
                      className="mx-auto text-neutral-400 mb-3"
                    />
                    <h3 className="font-serif text-base font-semibold text-neutral-900">
                      No Saved Addresses Yet
                    </h3>
                    <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                      Add your home or office address to make ordering swift and
                      seamless.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                    {addresses.map((addr) => (
                      <div
                        key={addr._id || addr.id}
                        className={`bg-white border rounded-2xl p-5 sm:p-6 relative shadow-xs flex flex-col justify-between ${
                          addr.isDefault
                            ? "border-black ring-1 ring-black"
                            : "border-neutral-200"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold uppercase tracking-wider text-neutral-900 bg-neutral-100 px-2.5 py-1 rounded">
                              {addr.label || "Address"}
                            </span>
                            {addr.isDefault && (
                              <span className="text-[10px] uppercase tracking-wider font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                Default
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-semibold text-neutral-900">
                            {addr.recipientName}
                          </h4>
                          <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                            {addr.street}
                            {addr.apartment ? `, ${addr.apartment}` : ""}
                            <br />
                            {addr.city} {addr.postalCode && `• ${addr.postalCode}`}
                            <br />
                            {addr.country}
                          </p>
                          <p className="text-xs text-neutral-500 mt-2 flex items-center gap-1.5">
                            <Phone size={12} /> {addr.phone}
                          </p>
                        </div>

                        <div className="pt-4 mt-4 border-t border-neutral-100 flex justify-end">
                          <button
                            onClick={() =>
                              handleDeleteAddress(addr._id || addr.id || "")
                            }
                            className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1 transition"
                          >
                            <Trash2 size={13} />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 3. PAYMENT METHODS TAB */}
            {activeTab === "payments" && (
              <div className="space-y-6">
                <div className="bg-white border border-neutral-200 rounded-2xl p-5 sm:p-6 md:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="font-serif text-lg sm:text-xl font-bold text-neutral-950">
                      Saved Payment Cards
                    </h2>
                    <p className="text-xs text-neutral-500 mt-1">
                      Encrypted and stored securely for immediate 1-click checkout.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowPaymentForm(!showPaymentForm)}
                    className="self-start sm:self-auto flex items-center justify-center gap-1.5 bg-neutral-950 text-white text-xs uppercase tracking-wider font-semibold px-4 py-2.5 rounded-lg hover:bg-neutral-800 transition shrink-0"
                  >
                    <Plus size={15} />
                    <span>{showPaymentForm ? "Cancel" : "Add Card"}</span>
                  </button>
                </div>

                {/* Add Payment Form */}
                {showPaymentForm && (
                  <div className="bg-white border border-neutral-200 rounded-2xl p-5 sm:p-6 md:p-8 shadow-xs">
                    <h3 className="font-serif text-base font-bold text-neutral-900 mb-4">
                      Add Credit / Debit Card
                    </h3>
                    <form id="add-payment-form" name="addPaymentForm" onSubmit={handleAddPayment} className="space-y-4">
                      <div>
                        <label htmlFor="payment-cardholder" className="block text-xs font-medium text-neutral-700 uppercase tracking-wider mb-1 cursor-pointer">
                          Name on Card *
                        </label>
                        <input
                          id="payment-cardholder"
                          name="cardHolder"
                          type="text"
                          autoComplete="cc-name"
                          required
                          value={newPayment.cardHolder}
                          onChange={(e) =>
                            setNewPayment({
                              ...newPayment,
                              cardHolder: e.target.value,
                            })
                          }
                          placeholder="e.g. AHMED KHAN"
                          className="w-full bg-white border border-neutral-300 rounded-lg p-2.5 text-xs text-neutral-900 uppercase focus:outline-none focus:ring-1 focus:ring-black"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="payment-cardnumber" className="block text-xs font-medium text-neutral-700 uppercase tracking-wider mb-1 cursor-pointer">
                            Card Number *
                          </label>
                          <input
                            id="payment-cardnumber"
                            name="cardNumber"
                            type="text"
                            autoComplete="cc-number"
                            required
                            maxLength={19}
                            value={newPayment.cardNumber}
                            onChange={(e) =>
                              setNewPayment({
                                ...newPayment,
                                cardNumber: e.target.value,
                              })
                            }
                            placeholder="4000 1234 5678 9010"
                            className="w-full bg-white border border-neutral-300 rounded-lg p-2.5 text-xs font-mono text-neutral-900 focus:outline-none focus:ring-1 focus:ring-black"
                          />
                        </div>
                        <div>
                          <label htmlFor="payment-expiry" className="block text-xs font-medium text-neutral-700 uppercase tracking-wider mb-1 cursor-pointer">
                            Expiration (MM/YY) *
                          </label>
                          <input
                            id="payment-expiry"
                            name="expiry"
                            type="text"
                            autoComplete="cc-exp"
                            required
                            maxLength={5}
                            value={newPayment.expiry}
                            onChange={(e) =>
                              setNewPayment({
                                ...newPayment,
                                expiry: e.target.value,
                              })
                            }
                            placeholder="12/28"
                            className="w-full bg-white border border-neutral-300 rounded-lg p-2.5 text-xs font-mono text-neutral-900 focus:outline-none focus:ring-1 focus:ring-black"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <input
                          type="checkbox"
                          id="defaultCard"
                          name="isDefault"
                          autoComplete="off"
                          checked={newPayment.isDefault}
                          onChange={(e) =>
                            setNewPayment({
                              ...newPayment,
                              isDefault: e.target.checked,
                            })
                          }
                          className="rounded border-neutral-300 text-black focus:ring-black"
                        />
                        <label
                          htmlFor="defaultCard"
                          className="text-xs text-neutral-700 cursor-pointer"
                        >
                          Set as default payment card
                        </label>
                      </div>

                      <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 sm:gap-3 pt-3">
                        <button
                          type="button"
                          onClick={() => setShowPaymentForm(false)}
                          className="w-full sm:w-auto px-4 py-2.5 border border-neutral-300 text-xs font-medium text-neutral-700 rounded-lg hover:bg-neutral-50 transition"
                        >
                          Cancel
                        </button>
                        <button
                          id="payment-save-btn"
                          name="savePayment"
                          type="submit"
                          disabled={saving}
                          className="w-full sm:w-auto px-5 py-2.5 bg-black text-white text-xs uppercase tracking-wider font-semibold rounded-lg hover:bg-neutral-800 transition"
                        >
                          {saving ? "Saving..." : "Save Card"}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Cards List */}
                {payments.length === 0 ? (
                  <div className="bg-white border border-neutral-200 rounded-2xl p-8 sm:p-12 text-center shadow-xs">
                    <CreditCard
                      size={32}
                      className="mx-auto text-neutral-400 mb-3"
                    />
                    <h3 className="font-serif text-base font-semibold text-neutral-900">
                      No Payment Cards Saved
                    </h3>
                    <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                      Add a Visa, Mastercard, or UnionPay card to fast-track your
                      future wardrobe orders.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                    {payments.map((card) => (
                      <div
                        key={card._id || card.id}
                        className="bg-linear-to-tr from-neutral-950 via-neutral-900 to-neutral-800 text-white p-5 sm:p-6 rounded-2xl shadow-md flex flex-col justify-between min-h-47.5 relative overflow-hidden"
                      >
                        {/* Decorative card circle */}
                        <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/5 rounded-full pointer-events-none" />

                        <div className="flex items-center justify-between">
                          <span className="text-[10px] sm:text-[11px] font-mono tracking-widest text-neutral-400 uppercase truncate max-w-45">
                            {card.cardType || "THREADCRAFT CARD"}
                          </span>
                          {card.isDefault && (
                            <span className="text-[9px] uppercase tracking-wider font-bold bg-white/20 text-white px-2 py-0.5 rounded-full shrink-0">
                              Default
                            </span>
                          )}
                        </div>

                        <div className="text-sm sm:text-base font-mono tracking-[0.16em] sm:tracking-[0.25em] text-neutral-200 my-2 select-all break-normal whitespace-nowrap">
                          &bull;&bull;&bull;&bull; &bull;&bull;&bull;&bull; &bull;&bull;&bull;&bull; {card.last4}
                        </div>

                        <div className="flex items-end justify-between text-xs text-neutral-300 gap-2">
                          <div className="min-w-0 flex-1">
                            <span className="block text-[9px] uppercase tracking-widest text-neutral-400">
                              Cardholder
                            </span>
                            <span className="font-medium uppercase truncate block text-xs">
                              {card.cardHolder}
                            </span>
                          </div>
                          <div className="text-center shrink-0">
                            <span className="block text-[9px] uppercase tracking-widest text-neutral-400">
                              Expires
                            </span>
                            <span className="font-mono text-xs">{card.expiry}</span>
                          </div>
                          <button
                            onClick={() =>
                              handleDeletePayment(card._id || card.id || "")
                            }
                            className="text-neutral-400 hover:text-red-400 transition p-1.5 shrink-0"
                            title="Remove Card"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 4. ORDERS HISTORY TAB */}
            {activeTab === "orders" && (
              <div className="space-y-6">
                <div className="bg-white border border-neutral-200 rounded-2xl p-5 sm:p-6 md:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="font-serif text-lg sm:text-xl font-bold text-neutral-950">
                      Wardrobe Orders
                    </h2>
                    <p className="text-xs text-neutral-500 mt-1">
                      Direct real-time tracking of garments placed under {email}.
                    </p>
                  </div>
                  <Link
                    href="/shop"
                    className="self-start sm:self-auto flex items-center gap-1.5 text-xs text-neutral-700 hover:text-black font-semibold uppercase tracking-wider shrink-0"
                  >
                    <span>Shop More</span>
                    <ExternalLink size={13} />
                  </Link>
                </div>

                {orders.length === 0 ? (
                  <div className="bg-white border border-neutral-200 rounded-2xl p-8 sm:p-12 text-center shadow-xs">
                    <Package
                      size={32}
                      className="mx-auto text-neutral-400 mb-3"
                    />
                    <h3 className="font-serif text-base font-semibold text-neutral-900">
                      No Orders Placed Yet
                    </h3>
                    <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto mb-5">
                      Explore our conscious wardrobe essentials and complete your
                      first order.
                    </p>
                    <Link
                      href="/shop"
                      className="inline-block px-5 py-2.5 bg-black text-white text-xs uppercase tracking-wider font-semibold rounded-lg hover:bg-neutral-800 transition"
                    >
                      Browse Studio Collection
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4 sm:space-y-5">
                    {orders.map((order) => (
                      <div
                        key={order._id || order.id || order.orderNumber}
                        className="bg-white border border-neutral-200 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4"
                      >
                        {/* Order Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 sm:pb-4 border-b border-neutral-100">
                          <div>
                            <span className="font-mono text-xs sm:text-sm font-bold text-neutral-950">
                              {order.orderNumber}
                            </span>
                            <span className="text-xs text-neutral-500 block sm:inline sm:ml-3">
                              Placed on{" "}
                              {new Date(order.createdAt).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                }
                              )}
                            </span>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-3 pt-1 sm:pt-0">
                            <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-800">
                              <Clock size={12} />
                              {order.orderStatus || "Processing"}
                            </span>
                            <span className="font-semibold text-xs sm:text-sm text-neutral-950">
                              ${order.total.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* Order Items List */}
                        <div className="divide-y divide-neutral-100">
                          {order.items.map((item, idx) => (
                            <div
                              key={idx}
                              className="py-3 flex items-center justify-between gap-3"
                            >
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className="w-12 h-12 bg-neutral-100 rounded-lg overflow-hidden shrink-0 relative">
                                  {item.image ? (
                                    <Image
                                      src={item.image}
                                      alt={item.name}
                                      fill
                                      className="object-cover"
                                      sizes="48px"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xs text-neutral-400">
                                      TC
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h5 className="text-xs font-semibold text-neutral-900 truncate">
                                    {item.name}
                                  </h5>
                                  <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                                    Size: {item.size} • Qty: {item.quantity}
                                    {item.color && ` • ${item.color}`}
                                  </p>
                                </div>
                              </div>
                              <span className="text-xs font-semibold text-neutral-800 shrink-0">
                                ${(item.price * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 5. SECURITY & PASSWORD TAB */}
            {activeTab === "security" && (
              <div className="bg-white border border-neutral-200 rounded-2xl p-5 sm:p-6 md:p-8 shadow-xs space-y-6">
                <div>
                  <h2 className="font-serif text-lg sm:text-xl font-bold text-neutral-950">
                    Security &amp; Account Protection
                  </h2>
                  <p className="text-xs text-neutral-500 mt-1">
                    Update your password and review your account authentication
                    status.
                  </p>
                </div>

                {/* Email Verification Banner */}
                <div className="p-4 sm:p-5 rounded-xl border border-neutral-200 bg-neutral-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <ShieldCheck
                      size={20}
                      className={`shrink-0 ${
                        isVerified ? "text-emerald-600" : "text-amber-500"
                      }`}
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-neutral-900">
                        Email Verification
                      </h4>
                      <p className="text-[11px] text-neutral-500 truncate sm:whitespace-normal">
                        {isVerified
                          ? "Your email has been verified."
                          : "Your email is unverified. Please confirm your 6-digit code."}
                      </p>
                    </div>
                  </div>
                  {!isVerified && (
                    <Link
                      href={`/verify-email?email=${encodeURIComponent(email)}`}
                      className="self-start sm:self-auto text-xs text-black font-semibold underline shrink-0"
                    >
                      Verify Now
                    </Link>
                  )}
                </div>

                {/* Change Password Form */}
                <form id="change-password-form" name="changePasswordForm" onSubmit={handleChangePassword} className="space-y-4 pt-2">
                  <h3 className="font-serif text-sm font-semibold text-neutral-900 flex items-center gap-2">
                    <Lock size={15} /> Change Wardrobe Password
                  </h3>

                  <div>
                    <label htmlFor="security-current-password" className="block text-xs font-medium text-neutral-700 uppercase tracking-wider mb-1 cursor-pointer">
                      Current Password *
                    </label>
                    <input
                      id="security-current-password"
                      name="currentPassword"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white border border-neutral-300 rounded-lg p-2.5 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="security-new-password" className="block text-xs font-medium text-neutral-700 uppercase tracking-wider mb-1 cursor-pointer">
                        New Password * (Min 6 chars)
                      </label>
                      <input
                        id="security-new-password"
                        name="newPassword"
                        type="password"
                        autoComplete="new-password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-white border border-neutral-300 rounded-lg p-2.5 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-black"
                      />
                    </div>
                    <div>
                      <label htmlFor="security-confirm-password" className="block text-xs font-medium text-neutral-700 uppercase tracking-wider mb-1 cursor-pointer">
                        Confirm New Password *
                      </label>
                      <input
                        id="security-confirm-password"
                        name="confirmPassword"
                        type="password"
                        autoComplete="new-password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-white border border-neutral-300 rounded-lg p-2.5 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-black"
                      />
                    </div>
                  </div>

                  <div className="pt-3 flex justify-end">
                    <button
                      id="password-update-btn"
                      name="updatePassword"
                      type="submit"
                      disabled={saving}
                      className="w-full sm:w-auto px-6 py-2.5 bg-neutral-950 text-white text-xs uppercase tracking-wider font-semibold rounded-lg hover:bg-neutral-800 disabled:bg-neutral-300 transition"
                    >
                      {saving ? "Updating..." : "Update Password"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
