import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import bcrypt from "bcryptjs";
import { sendVerificationEmail } from "@/lib/email";
import { signToken } from "@/lib/jwt";

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user || !user.password) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    if (!user.isVerified) {
      const verificationCode = crypto.randomInt(100000, 1000000).toString();
      const verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000);

      user.verificationCode = verificationCode;
      user.verificationCodeExpires = verificationCodeExpires;
      await user.save();

      await sendVerificationEmail({
        to: user.email,
        name: user.name,
        code: verificationCode,
        type: "signup",
      });

      return NextResponse.json(
        {
          success: true,
          requireVerification: true,
          message: "Please verify your email before logging in. A code has been sent.",
          email: user.email,
          devVerificationCode: process.env.SMTP_USER ? undefined : verificationCode,
        },
        { status: 200 }
      );
    }

    const userData = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };

    const token = signToken({
      userId: userData.id,
      name: userData.name,
      email: userData.email,
      role: userData.role,
    });

    const response = NextResponse.json(
      {
        success: true,
        message: "Logged in successfully.",
        token,
        user: userData,
      },
      { status: 200 }
    );

    response.cookies.set({
      name: "token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error logging in";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
