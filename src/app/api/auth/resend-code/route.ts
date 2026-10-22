import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required to resend verification code." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return NextResponse.json(
        { error: "Account not found with this email." },
        { status: 404 }
      );
    }

    // Generate fresh 6-digit code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    user.verificationCode = verificationCode;
    user.verificationCodeExpires = verificationCodeExpires;
    await user.save();

    // Send email
    await sendVerificationEmail({
      to: user.email,
      name: user.name,
      code: verificationCode,
      type: user.isVerified ? "login" : "signup",
    });

    return NextResponse.json(
      {
        success: true,
        message: "A new 6-digit verification code has been sent to your email.",
        devVerificationCode: process.env.SMTP_USER ? undefined : verificationCode,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error resending code";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
