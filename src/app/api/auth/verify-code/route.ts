import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { signToken } from "@/lib/jwt";

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { email, code } = body;

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email and verification code are required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const cleanCode = code.toString().trim();

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return NextResponse.json(
        { error: "Account not found with this email." },
        { status: 404 }
      );
    }

    // Check if code matches
    if (!user.verificationCode || user.verificationCode !== cleanCode) {
      return NextResponse.json(
        { error: "Invalid verification code. Please check and try again." },
        { status: 400 }
      );
    }

    // Check expiration
    if (
      !user.verificationCodeExpires ||
      new Date(user.verificationCodeExpires).getTime() < Date.now()
    ) {
      return NextResponse.json(
        { error: "Verification code has expired. Please request a new code." },
        { status: 400 }
      );
    }

    // Mark as verified & clear code
    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    const userData = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };

    // Generate JWT token
    const token = signToken({
      userId: userData.id,
      name: userData.name,
      email: userData.email,
      role: userData.role,
    });

    const response = NextResponse.json(
      {
        success: true,
        message: "Email successfully verified! Welcome to ThreadCraft.",
        token,
        user: userData,
      },
      { status: 200 }
    );

    // Set secure HTTP-only cookie
    response.cookies.set({
      name: "token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error verifying code";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
