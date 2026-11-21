import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Product } from "@/models/Product";

interface CacheEntry {
  data: {
    products: unknown[];
    total: number;
    page: number;
    totalPages: number;
    limit: number;
  };
  timestamp: number;
}

const productsMemoryCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 1000;
const MAX_CACHE_ENTRIES = 100;

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function clearProductsCache() {
  productsMemoryCache.clear();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const featured = searchParams.get("featured");
    const sort = searchParams.get("sort");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "12", 10));
    const skip = (page - 1) * limit;

    const cacheKey = `${category || ""}:${search || ""}:${featured || ""}:${sort || ""}:${limit}:${page}`;

    const cached = productsMemoryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json(cached.data, {
        status: 200,
        headers: { "X-Cache": "HIT" },
      });
    }

    await connectToDatabase();

    const filter: Record<string, unknown> = {};

    if (category) {
      const safeCategory = escapeRegex(category.trim());
      filter.category = { $regex: new RegExp(`^${safeCategory}$`, "i") };
    }

    if (featured === "true") {
      filter.featured = true;
    }

    if (search) {
      const safeSearch = escapeRegex(search.trim());
      filter.$or = [
        { name: { $regex: safeSearch, $options: "i" } },
        { description: { $regex: safeSearch, $options: "i" } },
        { category: { $regex: safeSearch, $options: "i" } },
      ];
    }

    let sortQuery: Record<string, 1 | -1> = { createdAt: -1 };
    if (sort === "price_asc") {
      sortQuery = { price: 1 };
    } else if (sort === "price_desc") {
      sortQuery = { price: -1 };
    } else if (sort === "newest") {
      sortQuery = { createdAt: -1 };
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort(sortQuery)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);

    const formattedProducts = products.map((p) => ({
      ...p,
      id: p._id.toString(),
    }));

    const totalPages = Math.max(1, Math.ceil(total / limit));

    const responsePayload = {
      products: formattedProducts,
      total,
      page,
      totalPages,
      limit,
    };

    if (productsMemoryCache.size >= MAX_CACHE_ENTRIES) {
      const oldestKey = productsMemoryCache.keys().next().value;
      if (oldestKey) productsMemoryCache.delete(oldestKey);
    }
    productsMemoryCache.set(cacheKey, {
      data: responsePayload,
      timestamp: Date.now(),
    });

    return NextResponse.json(responsePayload, {
      status: 200,
      headers: { "X-Cache": "MISS" },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch products";
    return NextResponse.json(
      { error: message, products: [], total: 0, page: 1, totalPages: 1, limit: 12 },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();

    clearProductsCache();

    if (Array.isArray(body)) {
      if (body.length === 0) {
        return NextResponse.json(
          { error: "Product array cannot be empty." },
          { status: 400 }
        );
      }
      const inserted = await Product.insertMany(body);
      return NextResponse.json(
        {
          message: `Successfully inserted ${inserted.length} products`,
          count: inserted.length,
          products: inserted,
        },
        { status: 201 }
      );
    }

    if (!body.name || !body.price || !body.category) {
      return NextResponse.json(
        { error: "Name, price, and category are required." },
        { status: 400 }
      );
    }

    const product = await Product.create(body);

    return NextResponse.json(
      {
        message: "Product created successfully",
        product: {
          ...product.toObject(),
          id: product._id.toString(),
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to create product";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
