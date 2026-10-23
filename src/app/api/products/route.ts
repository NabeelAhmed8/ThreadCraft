import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Product } from "@/models/Product";

// In-memory cache for ultra-fast product retrieval
interface CacheEntry {
  data: { products: unknown[]; total: number };
  timestamp: number;
}

const productsMemoryCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds TTL

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
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const cacheKey = `${category || ""}:${search || ""}:${featured || ""}:${sort || ""}:${limit}`;

    // Return instant cached response if valid
    const cached = productsMemoryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json(cached.data, {
        status: 200,
        headers: { "X-Cache": "HIT" },
      });
    }

    await connectToDatabase();

    // Build MongoDB filter query
    const filter: Record<string, unknown> = {};

    if (category) {
      filter.category = { $regex: new RegExp(`^${category}$`, "i") };
    }

    if (featured === "true") {
      filter.featured = true;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }

    // Sort definition
    let sortQuery: Record<string, 1 | -1> = { createdAt: -1 };
    if (sort === "price_asc") {
      sortQuery = { price: 1 };
    } else if (sort === "price_desc") {
      sortQuery = { price: -1 };
    } else if (sort === "newest") {
      sortQuery = { createdAt: -1 };
    }

    const products = await Product.find(filter)
      .sort(sortQuery)
      .limit(limit)
      .lean();

    // Format _id to id string
    const formattedProducts = products.map((p) => ({
      ...p,
      id: p._id.toString(),
    }));

    const responsePayload = {
      products: formattedProducts,
      total: formattedProducts.length,
    };

    // Store in memory cache
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
      error instanceof Error ? error.message : "Failed to fetch products from MongoDB";
    return NextResponse.json(
      { error: message, products: [], total: 0 },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();

    // Invalidate cache on mutations
    clearProductsCache();

    // Support both bulk insertion (array of products) and single product insertion
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
          message: `Successfully inserted ${inserted.length} products into MongoDB!`,
          count: inserted.length,
          products: inserted,
        },
        { status: 201 }
      );
    }

    // Single product validation
    if (!body.name || !body.price || !body.category) {
      return NextResponse.json(
        { error: "Name, price, and category are required." },
        { status: 400 }
      );
    }

    const product = await Product.create(body);

    return NextResponse.json(
      {
        message: "Product created successfully in MongoDB",
        product: {
          ...product.toObject(),
          id: product._id.toString(),
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to create product in MongoDB";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
