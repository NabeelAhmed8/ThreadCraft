import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";

export async function GET(request: NextRequest) {
  try {
    // 1. Check HTTP-only cookie first
    const cookieToken = request.cookies.get("token")?.value;

    // 2. Fallback to Authorization Header
    const authHeader = request.headers.get("authorization");
    const headerToken = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    const token = cookieToken || headerToken;

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized. No token provided." },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: "Invalid or expired session token." },
        { status: 401 }
      );
    }

    await connectToDatabase();
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error verifying authentication";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
