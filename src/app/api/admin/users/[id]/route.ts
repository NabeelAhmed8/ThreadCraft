import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { extractTokenFromRequest, verifyToken } from "@/lib/jwt";
import mongoose from "mongoose";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const body = await request.json();
    const { role } = body;

    if (!role || !["customer", "admin"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Role must be 'customer' or 'admin'." },
        { status: 400 }
      );
    }

    if (decoded.userId === id && role !== "admin") {
      return NextResponse.json(
        { error: "Security restriction: You cannot demote your own active admin account." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true, runValidators: true }
    ).select("-password -verificationCode -verificationCodeExpires");

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `User role successfully updated to ${role}`,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to update user role";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
