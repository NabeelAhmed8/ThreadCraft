"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  ShieldAlert,
  Package,
  ShoppingBag,
  Users,
  TrendingUp,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Trash2,
  Edit3,
  ExternalLink,
  Lock,
  LogOut,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Upload,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Product } from "@/types";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getAdminStats,
  getAdminUsers,
  updateUserRole,
  updateOrderStatus,
} from "@/lib/api";

type AdminTab = "overview" | "products" | "orders" | "rbac";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "customer" | "admin";
  isVerified: boolean;
  addressesCount: number;
  createdAt: string;
}

interface AdminOrder {
  id: string;
  orderNumber: string;
  customer: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
  };
  items: Array<{
    productId: string;
    name: string;
    price: number;
    image: string;
    size: string;
    color?: string;
    quantity: number;
  }>;
  subtotal: number;
  shipping: number;
  total: number;
  paymentMethod: "cod" | "card" | "stripe";
  paymentStatus: "pending" | "paid" | "failed";
  orderStatus: "received" | "processing" | "shipped" | "delivered" | "cancelled";
  createdAt: string;
}

interface StatsData {
  totalProducts: number;
  totalOrders: number;
  totalUsers: number;
  totalRevenue: number;
  adminCount: number;
  customerCount: number;
  lowStockProducts: Product[];
  recentOrders: AdminOrder[];
}

const EMPTY_PRODUCT_FORM: Partial<Product> = {
  name: "",
  slug: "",
  description: "",
  price: 0,
  compareAtPrice: 0,
  category: "men",
  sizes: ["S", "M", "L", "XL"],
  colors: [],
  images: [""],
  inStock: true,
  stockCount: 20,
  featured: false,
};

function compressImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        return reject(new Error("Failed to read file"));
      }
      const img = new window.Image();
      img.onerror = reject;
      img.onload = () => {
        const maxDimension = 1200;
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return resolve(reader.result as string);
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function AdminPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [stats, setStats] = useState<StatsData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [usersList, setUsersList] = useState<AdminUser[]>([]);

  const [loadingData, setLoadingData] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [productSearch, setProductSearch] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("");
  const [userSearch, setUserSearch] = useState("");

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState<Partial<Product>>(EMPTY_PRODUCT_FORM);
  const [activeImageSlot, setActiveImageSlot] = useState(0);
  const [submittingProduct, setSubmittingProduct] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);

  const loadAllAdminData = useCallback(async () => {
    setLoadingData(true);
    try {
      const [statsRes, productsRes, usersRes, ordersRes] = await Promise.all([
        getAdminStats(),
        getProducts({ limit: 100 }),
        getAdminUsers(),
        fetch("/api/orders", { cache: "no-store" }).then((r) => r.json()).catch(() => ({ orders: [] })),
      ]);

      if (statsRes.success && statsRes.stats) {
        setStats(statsRes.stats as StatsData);
      }
      if (productsRes.products) {
        setProducts(productsRes.products);
      }
      if (usersRes.success && usersRes.users) {
        setUsersList(usersRes.users);
      }
      if (ordersRes.orders) {
        setOrders(ordersRes.orders);
      }
    } catch {
      setActionMessage({ type: "error", text: "Failed to refresh dashboard data." });
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && isAuthenticated && user?.role === "admin") {
      loadAllAdminData();
    }
  }, [authLoading, isAuthenticated, user, loadAllAdminData]);

  const showNotification = (type: "success" | "error", text: string) => {
    setActionMessage({ type, text });
    setTimeout(() => setActionMessage(null), 5000);
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        (p.slug && p.slug.toLowerCase().includes(productSearch.toLowerCase()));
      const matchesCategory = !productCategory || p.category === productCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, productSearch, productCategory]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesSearch =
        o.orderNumber.toLowerCase().includes(orderSearch.toLowerCase()) ||
        o.customer.fullName.toLowerCase().includes(orderSearch.toLowerCase()) ||
        o.customer.email.toLowerCase().includes(orderSearch.toLowerCase());
      const matchesStatus = !orderStatusFilter || o.orderStatus === orderStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, orderSearch, orderStatusFilter]);

  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      return (
        u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase())
      );
    });
  }, [usersList, userSearch]);

  const openAddProductModal = () => {
    setEditingProductId(null);
    setActiveImageSlot(0);
    setProductForm({
      ...EMPTY_PRODUCT_FORM,
      images: [""],
      sizes: ["S", "M", "L", "XL"],
      colors: [],
    });
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (product: Product) => {
    setEditingProductId(String(product.id));
    setActiveImageSlot(0);
    setProductForm({
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: product.price,
      compareAtPrice: product.compareAtPrice || 0,
      category: product.category,
      sizes: product.sizes && product.sizes.length > 0 ? product.sizes : ["S", "M", "L", "XL"],
      colors: product.colors || [],
      images: product.images && product.images.length > 0 ? product.images : [""],
      inStock: product.inStock,
      stockCount: product.stockCount,
      featured: product.featured,
    });
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name || !productForm.price || !productForm.category) {
      showNotification("error", "Name, price, and category are required.");
      return;
    }

    setSubmittingProduct(true);
    const cleanedImages = (productForm.images || []).map((img) => (typeof img === "string" ? img.trim() : "")).filter(Boolean).slice(0, 5);
    const payload = {
      ...productForm,
      images: cleanedImages.length > 0 ? cleanedImages : ["https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80"],
      slug: productForm.slug?.trim() || productForm.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
    };

    try {
      if (editingProductId) {
        const res = await updateProduct(editingProductId, payload);
        if (res.success) {
          showNotification("success", `Product "${productForm.name}" updated successfully.`);
          setIsProductModalOpen(false);
          loadAllAdminData();
        } else {
          showNotification("error", res.error || "Failed to update product.");
        }
      } else {
        const res = await createProduct(payload);
        if (res.success) {
          showNotification("success", `Product "${productForm.name}" created successfully.`);
          setIsProductModalOpen(false);
          loadAllAdminData();
        } else {
          showNotification("error", res.error || "Failed to create product.");
        }
      }
    } catch (err: unknown) {
      showNotification("error", err instanceof Error ? err.message : "Error saving product.");
    } finally {
      setSubmittingProduct(false);
    }
  };

  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${productName}"?`)) {
      return;
    }
    try {
      const res = await deleteProduct(productId);
      if (res.success) {
        showNotification("success", `Product "${productName}" removed from catalog.`);
        loadAllAdminData();
      } else {
        showNotification("error", res.error || "Failed to delete product.");
      }
    } catch {
      showNotification("error", "Error deleting product.");
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await updateOrderStatus(orderId, newStatus);
      if (res.success) {
        showNotification("success", `Order #${orderId} status changed to ${newStatus}.`);
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, orderStatus: newStatus as AdminOrder["orderStatus"] } : o))
        );
      } else {
        showNotification("error", res.error || "Failed to update order status.");
      }
    } catch {
      showNotification("error", "Error updating order.");
    }
  };

  const handleToggleUserRole = async (targetUser: AdminUser) => {
    const nextRole = targetUser.role === "admin" ? "customer" : "admin";
    if (
      !window.confirm(
        `Are you sure you want to change ${targetUser.name}'s role from ${targetUser.role.toUpperCase()} to ${nextRole.toUpperCase()}?`
      )
    ) {
      return;
    }

    try {
      const res = await updateUserRole(targetUser.id, nextRole);
      if (res.success) {
        showNotification("success", `User role updated: ${targetUser.email} is now ${nextRole}.`);
        setUsersList((prev) =>
          prev.map((u) => (u.id === targetUser.id ? { ...u, role: nextRole } : u))
        );
      } else {
        showNotification("error", res.error || "Failed to update role.");
      }
    } catch {
      showNotification("error", "Error updating user role.");
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 text-white font-sans">
        <RefreshCw size={28} className="animate-spin text-neutral-400 mb-4" />
        <h2 className="text-sm font-mono tracking-widest uppercase text-neutral-300">
          Verifying Administrative Access
        </h2>
        <p className="text-xs text-neutral-500 mt-2">Checking RBAC session credentials...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-6 text-white font-sans">
        <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-14 h-14 bg-neutral-800 border border-neutral-700 rounded-full flex items-center justify-center mx-auto mb-6 text-neutral-300">
            <Lock size={24} />
          </div>
          <span className="text-[10px] font-mono tracking-widest uppercase text-neutral-400 px-3 py-1 bg-neutral-800 rounded-full">
            Protected Area &bull; 401
          </span>
          <h1 className="font-serif text-2xl font-bold mt-4 tracking-tight">Authentication Required</h1>
          <p className="text-xs text-neutral-400 mt-3 leading-relaxed">
            The ThreadCraft Admin Console is restricted to authorized studio personnel. Please log in with an administrator account to continue.
          </p>
          <div className="mt-8 space-y-3">
            <Link
              href="/login?redirect=/admin"
              className="block w-full py-3 bg-white text-black text-xs font-semibold uppercase tracking-wider rounded-lg hover:bg-neutral-200 transition"
            >
              Sign In to Admin Console
            </Link>
            <Link
              href="/"
              className="block w-full py-2.5 text-neutral-400 text-xs hover:text-white transition"
            >
              Return to Storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-6 text-white font-sans">
        <div className="max-w-lg w-full bg-neutral-900 border border-red-900/40 rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-16 h-16 bg-red-950/60 border border-red-800/80 rounded-full flex items-center justify-center mx-auto mb-6 text-red-400">
            <ShieldAlert size={30} />
          </div>
          <span className="text-[10px] font-mono tracking-widest uppercase text-red-400 px-3 py-1 bg-red-950/60 border border-red-800/50 rounded-full">
            Access Denied &bull; 403 Forbidden
          </span>
          <h1 className="font-serif text-2xl font-bold mt-4 tracking-tight">
            Role-Based Access Restricted
          </h1>
          <p className="text-xs text-neutral-400 mt-3 leading-relaxed">
            You are signed in as <strong className="text-white font-mono">{user.email}</strong>, which is assigned the{" "}
            <span className="text-amber-400 font-mono font-semibold uppercase">Customer</span> role. This administrative workspace requires the{" "}
            <span className="text-emerald-400 font-mono font-semibold uppercase">Admin</span> role.
          </p>

          <div className="my-6 p-4 bg-neutral-950/80 border border-neutral-800 rounded-xl text-left space-y-2">
            <div className="text-[11px] font-mono text-neutral-400 flex justify-between">
              <span>Your Current Role:</span>
              <span className="text-amber-400 uppercase font-semibold">{user.role}</span>
            </div>
            <div className="text-[11px] font-mono text-neutral-400 flex justify-between">
              <span>Required RBAC Privilege:</span>
              <span className="text-emerald-400 uppercase font-semibold">admin</span>
            </div>
            <div className="text-[10px] text-neutral-500 pt-2 border-t border-neutral-800">
              Tip: If this is your personal dev environment, you can promote your user to admin by executing:
              <pre className="mt-1.5 p-2 bg-neutral-900 rounded font-mono text-[10px] text-neutral-300 overflow-x-auto">
                node scripts/make-admin.mjs {user.email}
              </pre>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={async () => {
                await logout();
                router.push("/login?redirect=/admin");
              }}
              className="w-full py-3 bg-white text-black text-xs font-semibold uppercase tracking-wider rounded-lg hover:bg-neutral-200 transition"
            >
              Sign In with Different Account
            </button>
            <Link
              href="/"
              className="block w-full py-2.5 text-neutral-400 text-xs hover:text-white transition"
            >
              Back to Storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans pb-24">
      <header className="bg-neutral-950 text-white border-b border-neutral-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-serif text-lg tracking-wider font-bold">
              THREADCRAFT
            </Link>
            <span className="text-neutral-600">&bull;</span>
            <span className="text-xs font-mono tracking-widest uppercase text-neutral-400 flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-400" />
              Studio Console
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs text-neutral-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{user.email}</span>
              <span className="px-2 py-0.5 bg-neutral-800 text-emerald-400 rounded text-[10px] uppercase font-bold">
                {user.role}
              </span>
            </div>

            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-1 text-xs text-neutral-300 hover:text-white px-3 py-1.5 rounded-lg border border-neutral-800 hover:border-neutral-700 transition"
              title="Open customer storefront"
            >
              <span>Storefront</span>
              <ExternalLink size={12} />
            </Link>

            <button
              onClick={loadAllAdminData}
              disabled={loadingData}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg border border-neutral-800 hover:border-neutral-700 transition"
              title="Refresh all metrics"
            >
              <RefreshCw size={14} className={loadingData ? "animate-spin" : ""} />
            </button>

            <button
              onClick={async () => {
                await logout();
                router.push("/login");
              }}
              className="p-1.5 text-neutral-400 hover:text-red-400 rounded-lg border border-neutral-800 hover:border-neutral-700 transition"
              title="Sign Out"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-neutral-800/80 flex space-x-1 sm:space-x-4 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab("overview")}
            className={`py-3 px-3 text-xs font-medium tracking-wide border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === "overview"
                ? "border-white text-white font-semibold"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <TrendingUp size={14} />
            <span>Overview</span>
          </button>

          <button
            onClick={() => setActiveTab("products")}
            className={`py-3 px-3 text-xs font-medium tracking-wide border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === "products"
                ? "border-white text-white font-semibold"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <Package size={14} />
            <span>Products Catalog ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("orders")}
            className={`py-3 px-3 text-xs font-medium tracking-wide border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === "orders"
                ? "border-white text-white font-semibold"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <ShoppingBag size={14} />
            <span>Orders ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("rbac")}
            className={`py-3 px-3 text-xs font-medium tracking-wide border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === "rbac"
                ? "border-white text-white font-semibold"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <Users size={14} />
            <span>RBAC & Users ({usersList.length})</span>
          </button>
        </div>
      </header>

      {actionMessage && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div
            className={`p-4 rounded-xl text-xs font-medium flex items-center justify-between border ${
              actionMessage.type === "success"
                ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                : "bg-red-50 text-red-900 border-red-200"
            }`}
          >
            <div className="flex items-center gap-2">
              {actionMessage.type === "success" ? (
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle size={16} className="text-red-600 shrink-0" />
              )}
              <span>{actionMessage.text}</span>
            </div>
            <button
              onClick={() => setActionMessage(null)}
              className="text-neutral-500 hover:text-neutral-800"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {activeTab === "overview" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs">
                <div className="flex items-center justify-between text-neutral-500 text-xs font-mono uppercase tracking-wider">
                  <span>Gross Sales</span>
                  <TrendingUp size={16} className="text-emerald-600" />
                </div>
                <div className="mt-3 font-serif text-3xl font-bold text-neutral-950">
                  ${(stats?.totalRevenue || 0).toLocaleString()}
                </div>
                <div className="mt-2 text-[11px] text-neutral-500">Recorded across store orders</div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs">
                <div className="flex items-center justify-between text-neutral-500 text-xs font-mono uppercase tracking-wider">
                  <span>Total Orders</span>
                  <ShoppingBag size={16} className="text-blue-600" />
                </div>
                <div className="mt-3 font-serif text-3xl font-bold text-neutral-950">
                  {stats?.totalOrders ?? orders.length}
                </div>
                <div className="mt-2 text-[11px] text-neutral-500">Fulfilled & pending orders</div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs">
                <div className="flex items-center justify-between text-neutral-500 text-xs font-mono uppercase tracking-wider">
                  <span>Active Catalog</span>
                  <Package size={16} className="text-indigo-600" />
                </div>
                <div className="mt-3 font-serif text-3xl font-bold text-neutral-950">
                  {stats?.totalProducts ?? products.length}
                </div>
                <div className="mt-2 text-[11px] text-neutral-500">Live products in MongoDB</div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs">
                <div className="flex items-center justify-between text-neutral-500 text-xs font-mono uppercase tracking-wider">
                  <span>Registered Users</span>
                  <Users size={16} className="text-amber-600" />
                </div>
                <div className="mt-3 font-serif text-3xl font-bold text-neutral-950">
                  {stats?.totalUsers ?? usersList.length}
                </div>
                <div className="mt-2 text-[11px] text-neutral-500">
                  {stats?.adminCount ?? 1} Admins &bull; {stats?.customerCount ?? 0} Customers
                </div>
              </div>
            </div>

            {stats?.lowStockProducts && stats.lowStockProducts.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                <div className="flex items-center gap-2 text-amber-900 font-semibold text-xs tracking-wide uppercase font-mono">
                  <AlertTriangle size={16} className="text-amber-600" />
                  <span>Low Inventory Warnings (&le; 5 items)</span>
                </div>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {stats.lowStockProducts.map((p) => (
                    <div
                      key={p.id}
                      className="bg-white p-3 rounded-xl border border-amber-200 flex items-center justify-between text-xs"
                    >
                      <span className="font-medium truncate max-w-[180px]">{p.name}</span>
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded font-mono font-bold text-[10px]">
                        {p.stockCount} left
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white rounded-2xl border border-neutral-200 p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-serif text-lg font-bold text-neutral-950">Recent Store Orders</h3>
                  <button
                    onClick={() => setActiveTab("orders")}
                    className="text-xs text-neutral-600 hover:text-black font-medium flex items-center gap-1"
                  >
                    <span>View All</span>
                    <ChevronRight size={14} />
                  </button>
                </div>

                {orders.length === 0 ? (
                  <div className="py-12 text-center text-xs text-neutral-400">No orders placed yet.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-neutral-200 text-neutral-400 font-mono text-[11px] uppercase">
                          <th className="pb-3 font-medium">Order #</th>
                          <th className="pb-3 font-medium">Customer</th>
                          <th className="pb-3 font-medium">Total</th>
                          <th className="pb-3 font-medium">Status</th>
                          <th className="pb-3 font-medium">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {orders.slice(0, 5).map((ord) => (
                          <tr key={ord.id} className="hover:bg-neutral-50/60 transition">
                            <td className="py-3 font-mono font-bold text-neutral-900">{ord.orderNumber}</td>
                            <td className="py-3">
                              <div className="font-medium text-neutral-900">{ord.customer.fullName}</div>
                              <div className="text-[10px] text-neutral-500 font-mono">{ord.customer.email}</div>
                            </td>
                            <td className="py-3 font-mono font-semibold">${ord.total}</td>
                            <td className="py-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold ${
                                  ord.orderStatus === "delivered"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : ord.orderStatus === "shipped"
                                    ? "bg-blue-100 text-blue-800"
                                    : ord.orderStatus === "processing"
                                    ? "bg-purple-100 text-purple-800"
                                    : ord.orderStatus === "cancelled"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-neutral-100 text-neutral-800"
                                }`}
                              >
                                {ord.orderStatus}
                              </span>
                            </td>
                            <td className="py-3 text-neutral-500 font-mono text-[11px]">
                              {new Date(ord.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-xs space-y-6">
                <div>
                  <h3 className="font-serif text-lg font-bold text-neutral-950">Quick Actions</h3>
                  <p className="text-xs text-neutral-500 mt-1">Frequently used administrative tasks.</p>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={openAddProductModal}
                    className="w-full flex items-center justify-between p-3.5 rounded-xl border border-neutral-200 hover:border-black hover:bg-neutral-50 transition text-left text-xs font-medium"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-neutral-950 text-white flex items-center justify-center">
                        <Plus size={16} />
                      </div>
                      <div>
                        <div className="font-semibold text-neutral-900">Add New Garment</div>
                        <div className="text-[11px] text-neutral-500">Insert custom product into store</div>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-neutral-400" />
                  </button>

                  <button
                    onClick={() => setActiveTab("orders")}
                    className="w-full flex items-center justify-between p-3.5 rounded-xl border border-neutral-200 hover:border-black hover:bg-neutral-50 transition text-left text-xs font-medium"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                        <ShoppingBag size={16} />
                      </div>
                      <div>
                        <div className="font-semibold text-neutral-900">Process Store Orders</div>
                        <div className="text-[11px] text-neutral-500">Track and fulfill customer orders</div>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-neutral-400" />
                  </button>

                  <button
                    onClick={() => setActiveTab("rbac")}
                    className="w-full flex items-center justify-between p-3.5 rounded-xl border border-neutral-200 hover:border-black hover:bg-neutral-50 transition text-left text-xs font-medium"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-neutral-800 text-white flex items-center justify-center">
                        <ShieldCheck size={16} />
                      </div>
                      <div>
                        <div className="font-semibold text-neutral-900">Manage RBAC Roles</div>
                        <div className="text-[11px] text-neutral-500">Grant or revoke admin access</div>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-neutral-400" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "products" && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-1 items-center gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search product by title or slug..."
                    className="w-full pl-10 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:border-black"
                  />
                </div>

                <div className="flex items-center gap-1.5 text-xs">
                  <Filter size={14} className="text-neutral-400" />
                  <select
                    value={productCategory}
                    onChange={(e) => setProductCategory(e.target.value)}
                    className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-black font-medium"
                  >
                    <option value="">All Categories</option>
                    <option value="men">Men</option>
                    <option value="women">Women</option>
                    <option value="outerwear">Outerwear & Knits</option>
                    <option value="casual">Casual & Tees</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={openAddProductModal}
                  className="px-4 py-2 bg-black text-white rounded-xl text-xs font-semibold hover:bg-neutral-800 transition flex items-center gap-1.5"
                >
                  <Plus size={15} />
                  <span>New Product</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
              {filteredProducts.length === 0 ? (
                <div className="p-16 text-center">
                  <Package size={36} className="mx-auto text-neutral-300 mb-3" />
                  <h4 className="text-sm font-semibold text-neutral-900">No products found</h4>
                  <p className="text-xs text-neutral-500 mt-1">Try adjusting your search query or add a new product.</p>
                  <button
                    onClick={openAddProductModal}
                    className="mt-4 px-4 py-2 bg-black text-white text-xs font-medium rounded-lg hover:bg-neutral-800 transition"
                  >
                    Add First Garment
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-neutral-50/80 border-b border-neutral-200 text-neutral-500 font-mono text-[11px] uppercase">
                        <th className="py-3 px-4 font-medium">Garment</th>
                        <th className="py-3 px-4 font-medium">Category</th>
                        <th className="py-3 px-4 font-medium">Price</th>
                        <th className="py-3 px-4 font-medium">Stock</th>
                        <th className="py-3 px-4 font-medium">Featured</th>
                        <th className="py-3 px-4 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {filteredProducts.map((p) => {
                        const thumb = (p.images && p.images[0]) || "";
                        return (
                          <tr key={p.id} className="hover:bg-neutral-50/60 transition">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="relative w-10 h-12 bg-neutral-100 rounded overflow-hidden shrink-0">
                                  {thumb ? (
                                    <Image src={thumb} alt={p.name} fill className="object-cover" sizes="40px" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[9px] text-neutral-400">
                                      N/A
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-semibold text-neutral-900 truncate max-w-[220px]">
                                    {p.name}
                                  </div>
                                  <div className="text-[10px] text-neutral-400 font-mono truncate max-w-[220px]">
                                    {p.slug}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold bg-neutral-100 text-neutral-800">
                                {p.category}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono font-semibold text-neutral-900">
                              ${p.price}
                              {p.compareAtPrice && p.compareAtPrice > p.price && (
                                <span className="ml-1.5 text-[10px] text-neutral-400 line-through">
                                  ${p.compareAtPrice}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                                  !p.inStock || p.stockCount === 0
                                    ? "bg-red-100 text-red-800"
                                    : (p.stockCount ?? 0) <= 5
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-emerald-100 text-emerald-800"
                                }`}
                              >
                                {p.stockCount ?? 0} units
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono text-[11px]">
                              {p.featured ? (
                                <span className="text-amber-600 font-semibold flex items-center gap-1">
                                  <span>★</span> Featured
                                </span>
                              ) : (
                                <span className="text-neutral-400">&mdash;</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="inline-flex items-center gap-1">
                                <Link
                                  href={`/product/${p.slug || p.id}`}
                                  target="_blank"
                                  className="p-1.5 text-neutral-500 hover:text-black rounded transition"
                                  title="View on site"
                                >
                                  <ExternalLink size={14} />
                                </Link>
                                <button
                                  onClick={() => openEditProductModal(p)}
                                  className="p-1.5 text-neutral-500 hover:text-black rounded transition"
                                  title="Edit Garment"
                                >
                                  <Edit3 size={14} />
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(String(p.id), p.name)}
                                  className="p-1.5 text-neutral-400 hover:text-red-600 rounded transition"
                                  title="Delete Garment"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "orders" && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Search by order #, customer name, email..."
                  className="w-full pl-10 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:border-black"
                />
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                <Filter size={14} className="text-neutral-400" />
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-black font-medium"
                >
                  <option value="">All Statuses</option>
                  <option value="received">Received</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
              {filteredOrders.length === 0 ? (
                <div className="p-16 text-center text-xs text-neutral-400">
                  <ShoppingBag size={36} className="mx-auto text-neutral-300 mb-3" />
                  <p>No orders matching filter criteria.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-neutral-50/80 border-b border-neutral-200 text-neutral-500 font-mono text-[11px] uppercase">
                        <th className="py-3 px-4 font-medium">Order Number</th>
                        <th className="py-3 px-4 font-medium">Customer Details</th>
                        <th className="py-3 px-4 font-medium">Garments</th>
                        <th className="py-3 px-4 font-medium">Total</th>
                        <th className="py-3 px-4 font-medium">Payment</th>
                        <th className="py-3 px-4 font-medium">Status Update</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {filteredOrders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-neutral-50/60 transition">
                          <td className="py-3.5 px-4">
                            <button
                              onClick={() => setSelectedOrder(ord)}
                              className="font-mono font-bold text-neutral-950 hover:underline"
                            >
                              {ord.orderNumber}
                            </button>
                            <div className="text-[10px] text-neutral-400 font-mono">
                              {new Date(ord.createdAt).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-neutral-900">{ord.customer.fullName}</div>
                            <div className="text-[10px] text-neutral-500 font-mono">{ord.customer.email}</div>
                            <div className="text-[10px] text-neutral-400 truncate max-w-[180px]">
                              {ord.customer.city}, {ord.customer.country}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-medium text-neutral-800">
                              {ord.items.reduce((s, i) => s + i.quantity, 0)} item(s)
                            </span>
                            <div className="text-[10px] text-neutral-400 truncate max-w-[150px]">
                              {ord.items.map((i) => i.name).join(", ")}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-neutral-900">${ord.total}</td>
                          <td className="py-3.5 px-4">
                            <div className="uppercase font-mono text-[10px] font-semibold text-neutral-700">
                              {ord.paymentMethod}
                            </div>
                            <span
                              className={`text-[9px] font-mono uppercase font-bold px-1.5 py-0.5 rounded ${
                                ord.paymentStatus === "paid"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-neutral-100 text-neutral-700"
                              }`}
                            >
                              {ord.paymentStatus}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <select
                              value={ord.orderStatus}
                              onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)}
                              className="bg-neutral-50 border border-neutral-300 rounded-lg px-2.5 py-1 text-[11px] font-mono font-medium focus:outline-none focus:border-black cursor-pointer"
                            >
                              <option value="received">Received</option>
                              <option value="processing">Processing</option>
                              <option value="shipped">Shipped</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "rbac" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs">
                <div className="flex items-center gap-2 text-neutral-950 font-serif text-base font-bold">
                  <ShieldCheck size={18} className="text-emerald-600" />
                  <span>Admin Role (Administrator)</span>
                </div>
                <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
                  Full unrestricted administrative control. Authorized to create, modify, and delete catalog garments, process and change customer order statuses, and promote or demote registered users.
                </p>
                <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs font-mono text-neutral-600">
                  <span>Current Active Admins:</span>
                  <span className="font-bold text-neutral-900">{usersList.filter((u) => u.role === "admin").length}</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs">
                <div className="flex items-center gap-2 text-neutral-950 font-serif text-base font-bold">
                  <Users size={18} className="text-blue-600" />
                  <span>Customer Role (End User)</span>
                </div>
                <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
                  Standard shopper access. Authorized to browse the catalog, curate wardrobe carts, check out via Stripe or COD, and manage personal profile addresses, payment methods, and personal orders.
                </p>
                <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs font-mono text-neutral-600">
                  <span>Registered Customers:</span>
                  <span className="font-bold text-neutral-900">{usersList.filter((u) => u.role !== "admin").length}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-serif text-base font-bold text-neutral-950">User Role Management</h3>
                  <p className="text-xs text-neutral-500">Toggle privileges between Customer and Admin.</p>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search users..."
                    className="w-full pl-9 pr-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-neutral-50/80 border-b border-neutral-200 text-neutral-500 font-mono text-[11px] uppercase">
                      <th className="py-3 px-4 font-medium">User</th>
                      <th className="py-3 px-4 font-medium">Email</th>
                      <th className="py-3 px-4 font-medium">Verification</th>
                      <th className="py-3 px-4 font-medium">Current Role</th>
                      <th className="py-3 px-4 font-medium">Registered</th>
                      <th className="py-3 px-4 font-medium text-right">Role Assignment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {filteredUsers.map((u) => {
                      const isCurrentActiveAdmin = u.id === user.id;
                      return (
                        <tr key={u.id} className="hover:bg-neutral-50/60 transition">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-neutral-950 text-white flex items-center justify-center font-serif text-xs font-bold">
                                {u.name.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-semibold text-neutral-900">{u.name}</span>
                              {isCurrentActiveAdmin && (
                                <span className="text-[9px] bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded font-mono">
                                  You
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-neutral-600">{u.email}</td>
                          <td className="py-3 px-4">
                            {u.isVerified ? (
                              <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold">
                                Verified
                              </span>
                            ) : (
                              <span className="text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded text-[10px] font-mono uppercase">
                                Unverified
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider ${
                                u.role === "admin"
                                  ? "bg-black text-white"
                                  : "bg-neutral-100 text-neutral-700"
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-neutral-400">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {isCurrentActiveAdmin ? (
                              <span className="text-[10px] font-mono text-neutral-400 italic">Active Session</span>
                            ) : (
                              <button
                                onClick={() => handleToggleUserRole(u)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium transition border ${
                                  u.role === "admin"
                                    ? "border-red-300 text-red-700 hover:bg-red-50"
                                    : "border-neutral-300 text-neutral-800 hover:border-black hover:bg-neutral-100"
                                }`}
                              >
                                {u.role === "admin" ? "Demote to Customer" : "Promote to Admin"}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-xs">
              <h3 className="font-serif text-base font-bold text-neutral-950 mb-4">
                RBAC Access Control Matrix
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-neutral-200 text-neutral-500 font-mono text-[11px] uppercase">
                      <th className="pb-3 font-medium">Capability / Scope</th>
                      <th className="pb-3 font-medium text-center">Customer</th>
                      <th className="pb-3 font-medium text-center">Administrator</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 font-mono text-[11px]">
                    <tr>
                      <td className="py-3 font-sans font-medium text-neutral-900">
                        View Public Catalog & Filter Garments
                      </td>
                      <td className="py-3 text-center text-emerald-600 font-bold">✓ Allowed</td>
                      <td className="py-3 text-center text-emerald-600 font-bold">✓ Allowed</td>
                    </tr>
                    <tr>
                      <td className="py-3 font-sans font-medium text-neutral-900">
                        Add to Bag & Checkout (COD / Stripe)
                      </td>
                      <td className="py-3 text-center text-emerald-600 font-bold">✓ Allowed</td>
                      <td className="py-3 text-center text-emerald-600 font-bold">✓ Allowed</td>
                    </tr>
                    <tr>
                      <td className="py-3 font-sans font-medium text-neutral-900">
                        View Personal Profile & Own Orders
                      </td>
                      <td className="py-3 text-center text-emerald-600 font-bold">✓ Allowed</td>
                      <td className="py-3 text-center text-emerald-600 font-bold">✓ Allowed</td>
                    </tr>
                    <tr>
                      <td className="py-3 font-sans font-medium text-neutral-900">
                        Access Admin Console (/admin)
                      </td>
                      <td className="py-3 text-center text-red-500 font-bold">&times; 403 Forbidden</td>
                      <td className="py-3 text-center text-emerald-600 font-bold">✓ Full Access</td>
                    </tr>
                    <tr>
                      <td className="py-3 font-sans font-medium text-neutral-900">
                        Create, Edit, Delete Products (POST / PUT / DELETE)
                      </td>
                      <td className="py-3 text-center text-red-500 font-bold">&times; 403 Forbidden</td>
                      <td className="py-3 text-center text-emerald-600 font-bold">✓ Full Access</td>
                    </tr>
                    <tr>
                      <td className="py-3 font-sans font-medium text-neutral-900">
                        View All Customers&apos; Orders & Change Status
                      </td>
                      <td className="py-3 text-center text-red-500 font-bold">&times; 403 Forbidden</td>
                      <td className="py-3 text-center text-emerald-600 font-bold">✓ Full Access</td>
                    </tr>
                    <tr>
                      <td className="py-3 font-sans font-medium text-neutral-900">
                        Manage User Roles (Promote / Demote)
                      </td>
                      <td className="py-3 text-center text-red-500 font-bold">&times; 403 Forbidden</td>
                      <td className="py-3 text-center text-emerald-600 font-bold">✓ Full Access</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[94vh]">
            <div className="px-5 py-3 border-b border-neutral-200 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <h3 className="font-serif text-base font-bold text-neutral-950">
                  {editingProductId ? "Edit Garment" : "Add New Garment to Catalog"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="text-neutral-400 hover:text-black p-1 rounded-md transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="flex-1 flex flex-col overflow-y-auto no-scrollbar">
              <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-12 gap-4 text-xs">
                <div className="md:col-span-7 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-neutral-700 mb-1 text-[11px]">Product Name *</label>
                      <input
                        type="text"
                        required
                        value={productForm.name || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          const autoSlug = val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
                          setProductForm({
                            ...productForm,
                            name: val,
                            slug: productForm.slug && productForm.slug !== autoSlug ? productForm.slug : autoSlug,
                          });
                        }}
                        placeholder="e.g. Japanese Selvedge Denim Overshirt"
                        className="w-full h-9 px-3 bg-neutral-50 border border-neutral-300 rounded-lg focus:outline-none focus:border-black text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-neutral-700 mb-1 text-[11px]">Slug (URL Identifier)</label>
                      <input
                        type="text"
                        value={productForm.slug || ""}
                        onChange={(e) => setProductForm({ ...productForm, slug: e.target.value })}
                        placeholder="e.g. japanese-selvedge-denim-overshirt"
                        className="w-full h-9 px-3 bg-neutral-50 border border-neutral-300 rounded-lg focus:outline-none focus:border-black font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1 text-[11px]">Description *</label>
                    <textarea
                      required
                      rows={2}
                      value={productForm.description || ""}
                      onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                      placeholder="Fabric composition, silhouette, craftsmanship details..."
                      className="w-full h-16 p-2.5 bg-neutral-50 border border-neutral-300 rounded-lg focus:outline-none focus:border-black resize-none text-xs leading-relaxed"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3 items-start">
                    <div className="min-w-0">
                      <label className="block font-semibold text-neutral-700 mb-1 text-[11px] truncate">Price ($) *</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        value={productForm.price ?? 0}
                        onChange={(e) => setProductForm({ ...productForm, price: parseFloat(e.target.value) || 0 })}
                        className="w-full h-9 px-3 bg-neutral-50 border border-neutral-300 rounded-lg focus:outline-none focus:border-black font-mono text-xs"
                      />
                    </div>
                    <div className="min-w-0">
                      <label className="block font-semibold text-neutral-700 mb-1 text-[11px] truncate">Compare ($)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={productForm.compareAtPrice ?? 0}
                        onChange={(e) => setProductForm({ ...productForm, compareAtPrice: parseFloat(e.target.value) || 0 })}
                        className="w-full h-9 px-3 bg-neutral-50 border border-neutral-300 rounded-lg focus:outline-none focus:border-black font-mono text-xs"
                      />
                    </div>
                    <div className="min-w-0">
                      <label className="block font-semibold text-neutral-700 mb-1 text-[11px] truncate">Category *</label>
                      <div className="relative">
                        <select
                          value={productForm.category || "men"}
                          onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                          className="w-full h-9 pl-3 pr-8 bg-neutral-50 border border-neutral-300 rounded-lg focus:outline-none focus:border-black font-medium text-xs appearance-none cursor-pointer"
                        >
                          <option value="men">Men</option>
                          <option value="women">Women</option>
                          <option value="outerwear">Outerwear</option>
                          <option value="casual">Casual &amp; Tees</option>
                        </select>
                        <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-neutral-800">
                      <input
                        type="checkbox"
                        checked={productForm.inStock ?? true}
                        onChange={(e) => setProductForm({ ...productForm, inStock: e.target.checked })}
                        className="rounded border-neutral-300 text-black focus:ring-0"
                      />
                      <span>In Stock</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-neutral-800">
                      <input
                        type="checkbox"
                        checked={productForm.featured ?? false}
                        onChange={(e) => setProductForm({ ...productForm, featured: e.target.checked })}
                        className="rounded border-neutral-300 text-black focus:ring-0"
                      />
                      <span className="flex items-center gap-1">
                        <span className="text-amber-500">★</span> Featured Item
                      </span>
                    </label>
                  </div>
                </div>

                <div className="md:col-span-5 space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block font-semibold text-neutral-700 text-[11px]">
                        Product Images (1 - 5) *
                      </label>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        Slot {activeImageSlot + 1} of 5 {activeImageSlot === 0 ? "• Cover" : ""}
                      </span>
                    </div>

                    <div className="grid grid-cols-5 gap-1.5 mb-2">
                      {[0, 1, 2, 3, 4].map((idx) => {
                        const img = productForm.images?.[idx];
                        const isSelected = activeImageSlot === idx;
                        return (
                          <div
                            key={idx}
                            onClick={() => setActiveImageSlot(idx)}
                            className={`relative aspect-square rounded-lg border-2 overflow-hidden flex flex-col items-center justify-center cursor-pointer transition ${
                              isSelected
                                ? "border-black ring-1 ring-black bg-neutral-100"
                                : img
                                ? "border-neutral-300 hover:border-neutral-400 bg-neutral-50"
                                : "border-dashed border-neutral-300 hover:border-neutral-400 bg-neutral-50/50"
                            }`}
                          >
                            {img ? (
                              <>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={img}
                                  alt={`Slot ${idx + 1}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.opacity = "0.3";
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const imgs = [...(productForm.images || [])];
                                    imgs[idx] = "";
                                    setProductForm({ ...productForm, images: imgs });
                                  }}
                                  className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-black/75 hover:bg-black text-white flex items-center justify-center transition"
                                  title="Remove image"
                                >
                                  <X size={9} />
                                </button>
                              </>
                            ) : (
                              <div className="flex flex-col items-center justify-center text-neutral-400">
                                <Plus size={11} />
                                <span className="text-[8px] font-mono leading-none mt-0.5">{idx + 1}</span>
                              </div>
                            )}
                            {idx === 0 && (
                              <span className="absolute bottom-0 inset-x-0 bg-neutral-900/80 text-[7px] text-white font-mono text-center py-0.5 uppercase tracking-wider">
                                Cover
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <input
                        type="url"
                        value={productForm.images?.[activeImageSlot] || ""}
                        onChange={(e) => {
                          const imgs = [...(productForm.images || [])];
                          imgs[activeImageSlot] = e.target.value;
                          setProductForm({ ...productForm, images: imgs });
                        }}
                        placeholder={`Slot ${activeImageSlot + 1} URL or upload file...`}
                        className="flex-1 h-9 px-2.5 bg-neutral-50 border border-neutral-300 rounded-lg focus:outline-none focus:border-black font-mono text-[11px]"
                      />

                      <label className="h-9 px-2.5 bg-neutral-900 hover:bg-black text-white rounded-lg flex items-center gap-1 cursor-pointer text-xs font-medium transition shrink-0">
                        <Upload size={12} />
                        <span>File</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              const compressed = await compressImageFile(file);
                              if (compressed) {
                                const imgs = [...(productForm.images || [])];
                                imgs[activeImageSlot] = compressed;
                                setProductForm({ ...productForm, images: imgs });
                              }
                            } catch {
                              showNotification("error", "Failed to process image file.");
                            }
                            e.target.value = "";
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-neutral-700 mb-1 text-[11px]">Stock Units</label>
                      <input
                        type="number"
                        min="0"
                        value={productForm.stockCount ?? 20}
                        onChange={(e) => setProductForm({ ...productForm, stockCount: parseInt(e.target.value, 10) || 0 })}
                        className="w-full h-9 px-3 bg-neutral-50 border border-neutral-300 rounded-lg focus:outline-none focus:border-black font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-neutral-700 mb-1 text-[11px]">Sizes (CSV)</label>
                      <input
                        type="text"
                        value={(productForm.sizes || []).join(", ")}
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            sizes: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                          })
                        }
                        placeholder="S, M, L, XL"
                        className="w-full h-9 px-3 bg-neutral-50 border border-neutral-300 rounded-lg focus:outline-none focus:border-black font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1 text-[11px]">Colors (CSV)</label>
                    <input
                      type="text"
                      value={(productForm.colors || []).join(", ")}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          colors: e.target.value.split(",").map((c) => c.trim()).filter(Boolean),
                        })
                      }
                      placeholder="Charcoal, Bone White, Olive"
                      className="w-full h-9 px-3 bg-neutral-50 border border-neutral-300 rounded-lg focus:outline-none focus:border-black font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="px-5 py-3 border-t border-neutral-200 bg-neutral-50/70 flex justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-1.5 border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-100 transition font-medium text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingProduct}
                  className="px-5 py-1.5 bg-black text-white rounded-lg hover:bg-neutral-800 transition font-medium text-xs flex items-center gap-2"
                >
                  {submittingProduct && <RefreshCw size={12} className="animate-spin" />}
                  <span>{editingProductId ? "Save Changes" : "Create Product"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl my-8 text-xs">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
              <div>
                <h3 className="font-serif text-lg font-bold text-neutral-950">
                  Order Details: {selectedOrder.orderNumber}
                </h3>
                <span className="text-[10px] text-neutral-400 font-mono">
                  Placed on {new Date(selectedOrder.createdAt).toLocaleString()}
                </span>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-neutral-400 hover:text-black p-1">
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-1">
                <div className="font-semibold text-neutral-900">{selectedOrder.customer.fullName}</div>
                <div className="text-neutral-600 font-mono">{selectedOrder.customer.email} &bull; {selectedOrder.customer.phone}</div>
                <div className="text-neutral-500">{selectedOrder.customer.address}, {selectedOrder.customer.city}, {selectedOrder.customer.country}</div>
              </div>

              <div className="space-y-2">
                <div className="font-semibold text-neutral-900 uppercase font-mono text-[10px] tracking-wider">
                  Ordered Items ({selectedOrder.items.length})
                </div>
                <div className="divide-y divide-neutral-100 border border-neutral-200 rounded-xl overflow-hidden">
                  {selectedOrder.items.map((it, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-neutral-900">{it.name}</div>
                        <div className="text-[10px] text-neutral-400 font-mono">
                          Size: {it.size} {it.color ? `• Color: ${it.color}` : ""} • Qty: {it.quantity}
                        </div>
                      </div>
                      <div className="font-mono font-bold">${it.price * it.quantity}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex justify-between items-center font-mono font-bold text-sm">
                <span>Total Amount</span>
                <span>${selectedOrder.total}</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-neutral-200 flex justify-end">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-neutral-950 text-white rounded-lg hover:bg-neutral-800 transition text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
