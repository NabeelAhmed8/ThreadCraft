import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Product } from "@/models/Product";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const featured = searchParams.get("featured");
    const sort = searchParams.get("sort");
    const limit = parseInt(searchParams.get("limit") || "50", 10);

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

    const [products, total] = await Promise.all([
      Product.find(filter).sort(sortQuery).limit(limit).lean(),
      Product.countDocuments(filter),
    ]);

    // Format _id to id string
    const formattedProducts = products.map((p) => ({
      ...p,
      id: p._id.toString(),
    }));

    return NextResponse.json(
      {
        products: formattedProducts,
        total,
      },
      { status: 200 }
    );
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
