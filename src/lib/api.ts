import { Product, Category, OrderPayload, OrderResponse } from "@/types";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

function getBaseUrl() {
  if (typeof window !== "undefined") {
    return "/api";
  }
  return API_BASE_URL;
}

interface FetchProductsOptions {
  category?: string;
  search?: string;
  sort?: "price_asc" | "price_desc" | "newest" | string;
  limit?: number;
  featured?: boolean;
}

export async function getProducts(
  options: FetchProductsOptions = {}
): Promise<{ products: Product[]; total: number; error?: string }> {
  try {
    const baseUrl = getBaseUrl();
    const query = new URLSearchParams();
    if (options.category) query.append("category", options.category);
    if (options.search) query.append("search", options.search);
    if (options.sort) query.append("sort", options.sort);
    if (options.limit) query.append("limit", options.limit.toString());
    if (options.featured) query.append("featured", "true");

    const url = `${baseUrl}/products?${query.toString()}`;
    const res = await fetch(url, {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`API returned status: ${res.status}`);
    }

    const data = await res.json();
    if (Array.isArray(data)) {
      return { products: data, total: data.length };
    }
    return {
      products: Array.isArray(data.products) ? data.products : (data.data || []),
      total: data.total || (data.products ? data.products.length : 0),
    };
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "Unable to load products right now";
    return { products: [], total: 0, error: errorMessage };
  }
}

export async function getProductById(
  id: string | number
): Promise<{ product: Product | null; error?: string }> {
  try {
    const baseUrl = getBaseUrl();
    const res = await fetch(`${baseUrl}/products/${id}`, {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`Product not found (${res.status})`);
    }

    const data = await res.json();
    const product = data.product || data.data || data;
    return { product };
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "Failed to fetch product";
    return { product: null, error: errorMessage };
  }
}

export async function createProduct(
  productData: Partial<Product>
): Promise<{ success: boolean; product?: Product; error?: string }> {
  try {
    const baseUrl = getBaseUrl();
    const res = await fetch(`${baseUrl}/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(productData),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || data.message || `Failed to create product (${res.status})`);
    }

    return { success: true, product: data.product || data };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create product",
    };
  }
}

export async function deleteProduct(
  id: string | number
): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    const baseUrl = getBaseUrl();
    const res = await fetch(`${baseUrl}/products/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || data.message || `Failed to delete product (${res.status})`);
    }

    return { success: true, message: data.message || "Product deleted successfully" };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete product",
    };
  }
}

export async function updateProduct(
  id: string | number,
  productData: Partial<Product>
): Promise<{ success: boolean; product?: Product; error?: string }> {
  try {
    const baseUrl = getBaseUrl();
    const res = await fetch(`${baseUrl}/products/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(productData),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || data.message || `Failed to update product (${res.status})`);
    }

    return { success: true, product: data.product || data };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update product",
    };
  }
}

export async function getCategories(): Promise<{
  categories: Category[];
  error?: string;
}> {
  try {
    const baseUrl = getBaseUrl();
    const res = await fetch(`${baseUrl}/categories`, {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to load categories: status ${res.status}`);
    }

    const data = await res.json();
    const categories = Array.isArray(data)
      ? data
      : data.categories || data.data || [];
    return { categories };
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "Failed to fetch categories";
    return { categories: [], error: errorMessage };
  }
}

export async function createOrder(
  payload: OrderPayload
): Promise<OrderResponse> {
  try {
    const baseUrl = getBaseUrl();
    const res = await fetch(`${baseUrl}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || data.error || `Order failed (${res.status})`);
    }

    return {
      success: true,
      orderId: data.orderId || data.id,
      message: data.message || "Your order has been placed successfully!",
    };
  } catch (err: unknown) {
    return {
      success: false,
      message:
        err instanceof Error ? err.message : "Unable to place your order right now. Please try again.",
    };
  }
}

export async function getAdminStats(): Promise<{
  success: boolean;
  stats?: {
    totalProducts: number;
    totalOrders: number;
    totalUsers: number;
    totalRevenue: number;
    adminCount: number;
    customerCount: number;
    lowStockProducts: Product[];
    recentOrders: unknown[];
  };
  error?: string;
}> {
  try {
    const baseUrl = getBaseUrl();
    const res = await fetch(`${baseUrl}/admin/stats`, {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `Failed to fetch stats (${res.status})`);
    }

    return { success: true, stats: data.stats };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to load admin stats",
    };
  }
}

export async function getAdminUsers(): Promise<{
  success: boolean;
  users?: Array<{
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: "customer" | "admin";
    isVerified: boolean;
    addressesCount: number;
    createdAt: string;
  }>;
  error?: string;
}> {
  try {
    const baseUrl = getBaseUrl();
    const res = await fetch(`${baseUrl}/admin/users`, {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `Failed to fetch users (${res.status})`);
    }

    return { success: true, users: data.users };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to load users",
    };
  }
}

export async function updateUserRole(
  userId: string,
  role: "customer" | "admin"
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const baseUrl = getBaseUrl();
    const res = await fetch(`${baseUrl}/admin/users/${userId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ role }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `Failed to update role (${res.status})`);
    }

    return { success: true, message: data.message };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update role",
    };
  }
}

export async function updateOrderStatus(
  orderId: string,
  orderStatus: string,
  paymentStatus?: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const baseUrl = getBaseUrl();
    const res = await fetch(`${baseUrl}/orders/${orderId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ orderStatus, paymentStatus }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `Failed to update order (${res.status})`);
    }

    return { success: true, message: data.message };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update order status",
    };
  }
}

export async function seedProducts(): Promise<{
  success: boolean;
  message?: string;
  count?: number;
  error?: string;
}> {
  try {
    const baseUrl = getBaseUrl();
    const res = await fetch(`${baseUrl}/admin/seed`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `Failed to seed products (${res.status})`);
    }

    return { success: true, message: data.message, count: data.count };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to seed products",
    };
  }
}

