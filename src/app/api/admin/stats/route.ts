import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Product } from "@/models/Product";
import { Order } from "@/models/Order";
import { User } from "@/models/User";
import { extractTokenFromRequest, verifyToken } from "@/lib/jwt";

export async function GET(request: NextRequest) {
  try {
    const token = extractTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized. Admin privileges required." },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden. Admin privileges required." },
        { status: 403 }
      );
    }

    await connectToDatabase();

    const [totalProducts, totalOrders, totalUsers, lowStockProducts, recentOrders, revenueAgg] =
      await Promise.all([
        Product.countDocuments(),
        Order.countDocuments(),
        User.countDocuments(),
        Product.find({ stockCount: { $lte: 5 } }).limit(5).lean(),
        Order.find().sort({ createdAt: -1 }).limit(5).lean(),
        Order.aggregate([
          { $group: { _id: null, totalRevenue: { $sum: "$total" } } },
        ]),
      ]);

    const totalRevenue = revenueAgg[0]?.totalRevenue || 0;

    const [adminCount, customerCount] = await Promise.all([
      User.countDocuments({ role: "admin" }),
      User.countDocuments({ role: { $ne: "admin" } }),
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        totalProducts,
        totalOrders,
        totalUsers,
        totalRevenue,
        adminCount,
        customerCount,
        lowStockProducts: lowStockProducts.map((p) => ({
          ...p,
          id: p._id.toString(),
        })),
        recentOrders: recentOrders.map((o) => ({
          ...o,
          id: o._id.toString(),
        })),
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to load admin stats";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
