import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Subscriber from "@/models/Subscriber";
import { sendNewsletterWelcomeEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json(
        { error: "Please enter a valid email address (e.g., name@example.com)." },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Check if subscriber already exists
    const existing = await Subscriber.findOne({ email: cleanEmail });

    if (existing) {
      if (existing.status === "active") {
        return NextResponse.json(
          {
            success: true,
            message: "You're already subscribed to the ThreadCraft circle!",
          },
          { status: 200 }
        );
      } else {
        existing.status = "active";
        await existing.save();

        // Optionally send welcome email in background
        sendNewsletterWelcomeEmail(cleanEmail).catch((err) =>
          console.error("Welcome email error:", err)
        );

        return NextResponse.json(
          {
            success: true,
            message: "Welcome back! Your newsletter subscription is reactivated.",
          },
          { status: 200 }
        );
      }
    }

    // Create new subscriber
    await Subscriber.create({
      email: cleanEmail,
      status: "active",
      source: "footer",
    });

    // Send welcome email in background
    sendNewsletterWelcomeEmail(cleanEmail).catch((err) =>
      console.error("Welcome email error:", err)
    );

    return NextResponse.json(
      {
        success: true,
        message: "Thank you for subscribing! Check your inbox for exclusive updates.",
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error("Newsletter subscription error:", err);
    return NextResponse.json(
      { error: "Failed to process subscription. Please try again later." },
      { status: 500 }
    );
  }
}
