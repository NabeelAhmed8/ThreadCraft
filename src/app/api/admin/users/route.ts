import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
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

    const users = await User.find(
      {},
      "name email phone role isVerified createdAt addresses paymentMethods"
    )
      .sort({ createdAt: -1 })
      .lean();

    const formattedUsers = users.map((u) => ({
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role || "customer",
      isVerified: !!u.isVerified,
      addressesCount: u.addresses?.length || 0,
      createdAt: u.createdAt,
    }));

    return NextResponse.json({
      success: true,
      users: formattedUsers,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to load users list";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
