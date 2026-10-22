import { Product, Category, OrderPayload, OrderResponse } from "@/types";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

function getBaseUrl() {
  if (typeof window !== "undefined") {
    // Relative URL works cleanly in the browser on port 3000
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

/**
 * GET: Fetch products list from Next.js built-in API (/api/products)
 * NO mock products: returns empty array or error if MongoDB is unavailable.
 */
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
      err instanceof Error ? err.message : "Failed to connect to MongoDB API";
    return { products: [], total: 0, error: errorMessage };
  }
}

/**
 * GET: Fetch a single product by ID from /api/products/:id
 */
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
      throw new Error(`Product not found in MongoDB (${res.status})`);
    }

    const data = await res.json();
    const product = data.product || data.data || data;
    return { product };
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "Failed to fetch product from MongoDB";
    return { product: null, error: errorMessage };
  }
}

/**
 * POST: Create a new product in MongoDB (/api/products)
 */
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
      error: err instanceof Error ? err.message : "Failed to POST product to MongoDB",
    };
  }
}

/**
 * DELETE: Delete a product from MongoDB (/api/products/:id)
 */
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

    return { success: true, message: data.message || "Product deleted successfully from MongoDB" };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to DELETE product from MongoDB",
    };
  }
}

/**
 * PUT: Update product in MongoDB (/api/products/:id)
 */
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
      error: err instanceof Error ? err.message : "Failed to PUT product to MongoDB",
    };
  }
}

/**
 * GET: Fetch categories
 */
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

/**
 * POST: Submit order to MongoDB (/api/orders)
 */
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
      message: data.message || "Order registered in MongoDB successfully!",
    };
  } catch (err: unknown) {
    return {
      success: false,
      message:
        err instanceof Error ? err.message : "Network error creating order in MongoDB.",
    };
  }
}
