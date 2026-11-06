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
    const { name, email, phone, password } = body;

    // Basic Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    // Check if user already exists
    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email address already exists." },
        { status: 409 }
      );
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate cryptographically secure 6-digit verification code
    const verificationCode = crypto.randomInt(100000, 1000000).toString();
    const verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    // Create user in MongoDB
    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone ? phone.trim() : "",
      password: hashedPassword,
      role: "customer",
      isVerified: false,
      verificationCode,
      verificationCodeExpires,
    });

    // Send verification email via Nodemailer
    await sendVerificationEmail({
      to: newUser.email,
      name: newUser.name,
      code: verificationCode,
      type: "signup",
    });

    return NextResponse.json(
      {
        success: true,
        requireVerification: true,
        message: "Account created! A verification code has been sent to your email.",
        email: newUser.email,
        devVerificationCode: process.env.SMTP_USER ? undefined : verificationCode,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error creating account";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
