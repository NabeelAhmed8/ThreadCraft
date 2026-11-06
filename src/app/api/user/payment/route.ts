import { NextRequest, NextResponse } from "next/server";
import { IPaymentMethod } from "@/models/User";
import { getAuthUser } from "@/lib/jwt";
import mongoose from "mongoose";

// POST: Add new card payment method
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { cardHolder, cardNumber, expiry, isDefault } = body;

    if (!cardHolder || !cardNumber || !expiry) {
      return NextResponse.json(
        { error: "Cardholder name, card number, and expiry are required." },
        { status: 400 }
      );
    }

    const cleanCard = cardNumber.replace(/\s+/g, "");
    if (cleanCard.length < 13 || cleanCard.length > 19) {
      return NextResponse.json(
        { error: "Please enter a valid card number." },
        { status: 400 }
      );
    }

    const last4 = cleanCard.slice(-4);

    // Detect card type
    let cardType = "Visa";
    if (cleanCard.startsWith("5") || cleanCard.startsWith("2")) {
      cardType = "Mastercard";
    } else if (cleanCard.startsWith("3")) {
      cardType = "American Express";
    }

    // If marked default, unset others
    if (isDefault) {
      user.paymentMethods.forEach((card: IPaymentMethod) => {
        card.isDefault = false;
      });
    }

    const isFirst = user.paymentMethods.length === 0;

    user.paymentMethods.push({
      cardHolder: cardHolder.trim(),
      cardType,
      last4,
      expiry: expiry.trim(),
      isDefault: isFirst || !!isDefault,
    });

    await user.save();

    return NextResponse.json({
      success: true,
      message: "Payment card saved securely!",
      paymentMethods: user.paymentMethods,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error saving payment method";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE: Remove card payment method
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { paymentId } = body;

    if (!paymentId) {
      return NextResponse.json(
        { error: "paymentId is required." },
        { status: 400 }
      );
    }

    const docArray = user.paymentMethods as mongoose.Types.DocumentArray<
      IPaymentMethod & mongoose.Document
    >;
    const target = docArray.id(paymentId);
    if (target) {
      const wasDefault = target.isDefault;
      target.deleteOne();
      if (wasDefault && user.paymentMethods.length > 0) {
        user.paymentMethods[0].isDefault = true;
      }
    }

    await user.save();

    return NextResponse.json({
      success: true,
      message: "Payment method removed successfully.",
      paymentMethods: user.paymentMethods,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error deleting payment method";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
