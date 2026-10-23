import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { verifyToken } from "@/lib/jwt";
import bcrypt from "bcryptjs";

// Helper to get authenticated user from request token
async function getAuthUser(request: NextRequest) {
  const token =
    request.cookies.get("token")?.value ||
    (request.headers.get("authorization")?.startsWith("Bearer ")
      ? request.headers.get("authorization")?.split(" ")[1]
      : null);

  if (!token) return null;
  const decoded = verifyToken(token);
  if (!decoded || !decoded.userId) return null;

  await connectToDatabase();
  return User.findById(decoded.userId);
}

// GET: Retrieve user profile
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        role: user.role,
        isVerified: user.isVerified,
        addresses: user.addresses || [],
        paymentMethods: user.paymentMethods || [],
        createdAt: user.createdAt,
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error fetching user profile";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT: Update personal details or change password
export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, phone, currentPassword, newPassword } = body;

    // Update name
    if (name && name.trim()) {
      user.name = name.trim();
    }

    // Update phone
    if (phone !== undefined) {
      user.phone = phone.trim();
    }

    // Password change request
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Current password is required to set a new password." },
          { status: 400 }
        );
      }

      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: "New password must be at least 6 characters long." },
          { status: 400 }
        );
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password || "");
      if (!isMatch) {
        return NextResponse.json(
          { error: "Incorrect current password." },
          { status: 400 }
        );
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    await user.save();

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully!",
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        role: user.role,
        isVerified: user.isVerified,
        addresses: user.addresses || [],
        paymentMethods: user.paymentMethods || [],
        createdAt: user.createdAt,
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error updating user profile";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
