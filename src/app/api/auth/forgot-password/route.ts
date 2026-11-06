import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { sendVerificationEmail } from "@/lib/email";

function maskEmail(email: string): string {
  const [localPart, domain] = email.split("@");
  if (!domain) return email;
  const visible = localPart.slice(0, 2);
  return `${visible}***@${domain}`;
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { identifier } = body;

    if (!identifier || typeof identifier !== "string" || !identifier.trim()) {
      return NextResponse.json(
        { error: "Please enter your registered email address or phone number." },
        { status: 400 }
      );
    }

    const cleanIdentifier = identifier.trim();
    const normalizedEmail = cleanIdentifier.toLowerCase();

    // Search user by email or phone
    const user = await User.findOne({
      $or: [
        { email: normalizedEmail },
        { phone: cleanIdentifier },
      ],
    });

    if (!user) {
      return NextResponse.json(
        { error: "No account found matching this email or phone number." },
        { status: 404 }
      );
    }

    // Generate cryptographically secure 6-digit OTP code with 15-minute expiration
    const verificationCode = crypto.randomInt(100000, 1000000).toString();
    const verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000);

    user.verificationCode = verificationCode;
    user.verificationCodeExpires = verificationCodeExpires;
    await user.save();

    // Send code via email
    await sendVerificationEmail({
      to: user.email,
      name: user.name,
      code: verificationCode,
      type: "reset-password",
    });

    return NextResponse.json(
      {
        success: true,
        message: `A 6-digit reset code has been sent to ${maskEmail(user.email)}.`,
        email: user.email,
        devVerificationCode: process.env.SMTP_USER ? undefined : verificationCode,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error processing password reset request";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

