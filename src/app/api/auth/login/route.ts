import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import bcrypt from "bcryptjs";
import { sendVerificationEmail } from "@/lib/email";

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

    // Verify hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // Generate cryptographically secure 6-digit verification code
    const verificationCode = crypto.randomInt(100000, 1000000).toString();
    const verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    user.verificationCode = verificationCode;
    user.verificationCodeExpires = verificationCodeExpires;
    await user.save();

    // Send verification email via Nodemailer
    await sendVerificationEmail({
      to: user.email,
      name: user.name,
      code: verificationCode,
      type: "login",
    });

    return NextResponse.json(
      {
        success: true,
        requireVerification: true,
        message: "Verification code sent to your email.",
        email: user.email,
        devVerificationCode: process.env.SMTP_USER ? undefined : verificationCode,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error logging in";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
