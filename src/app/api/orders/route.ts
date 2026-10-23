import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Order } from "@/models/Order";
import { User, IAddress, IPaymentMethod } from "@/models/User";

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();

    if (!body.items || body.items.length === 0 || !body.customer) {
      return NextResponse.json(
        { error: "Cart items and customer details are required." },
        { status: 400 }
      );
    }

    // Generate unique order reference (e.g., TC-729104)
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const orderNumber = `TC-${randomSuffix}`;

    const newOrder = await Order.create({
      orderNumber,
      customer: body.customer,
      items: body.items,
      subtotal: body.subtotal,
      shipping: body.shipping || 0,
      total: body.total,
      paymentMethod: body.paymentMethod || "cod",
      notes: body.notes || "",
    });

    // Automatically sync Address & Payment method to User Profile in MongoDB
    if (body.customer?.email) {
      try {
        const normalizedEmail = body.customer.email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });

        if (user) {
          // 1. Sync phone if not yet set
          if (!user.phone && body.customer.phone) {
            user.phone = body.customer.phone.trim();
          }

          // 2. Automatically save checkout shipping address to user's profile
          const incomingStreet = (body.customer.address || "").toLowerCase().trim();
          const incomingCity = (body.customer.city || "").toLowerCase().trim();

          if (incomingStreet && incomingCity) {
            const addressExists = user.addresses.some(
              (a: IAddress) =>
                a.street.toLowerCase().trim() === incomingStreet &&
                a.city.toLowerCase().trim() === incomingCity
            );

            if (!addressExists) {
              const isFirst = user.addresses.length === 0;
              user.addresses.push({
                label: isFirst ? "Default" : `Shipping ${user.addresses.length + 1}`,
                recipientName: body.customer.fullName || user.name,
                phone: body.customer.phone || user.phone || "",
                street: body.customer.address.trim(),
                city: body.customer.city.trim(),
                postalCode: body.customer.postalCode ? body.customer.postalCode.trim() : "",
                country: body.customer.country ? body.customer.country.trim() : "Pakistan",
                isDefault: isFirst,
              });
            }
          }

          // 3. Automatically save checkout payment card to user's profile if card used
          if (
            body.paymentMethod === "card" &&
            body.cardDetails?.cardNumber
          ) {
            const cleanCard = body.cardDetails.cardNumber.replace(/\s+/g, "");
            if (cleanCard.length >= 4) {
              const last4 = cleanCard.slice(-4);
              const cardExists = user.paymentMethods.some(
                (c: IPaymentMethod) => c.last4 === last4
              );

              if (!cardExists) {
                let cardType = "Visa";
                if (cleanCard.startsWith("5") || cleanCard.startsWith("2")) {
                  cardType = "Mastercard";
                } else if (cleanCard.startsWith("3")) {
                  cardType = "American Express";
                }

                const isFirstCard = user.paymentMethods.length === 0;
                user.paymentMethods.push({
                  cardHolder: (
                    body.cardDetails.cardHolder ||
                    body.customer.fullName ||
                    user.name
                  ).toUpperCase().trim(),
                  cardType,
                  last4,
                  expiry: body.cardDetails.expiry || "12/28",
                  isDefault: isFirstCard,
                });
              }
            }
          }

          await user.save();
        }
      } catch (syncErr) {
        // Non-blocking sync error
        console.error("Profile sync notice during checkout:", syncErr);
      }
    }

    return NextResponse.json(
      {
        success: true,
        orderId: newOrder.orderNumber,
        message: "Your order has been placed successfully!",
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unable to record order. Please try again.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const email = request.nextUrl.searchParams.get("email");
    const query = email ? { "customer.email": email.toLowerCase().trim() } : {};

    const orders = await Order.find(query).sort({ createdAt: -1 }).limit(100).lean();

    const formattedOrders = orders.map((o) => ({
      ...o,
      id: o._id.toString(),
    }));

    return NextResponse.json({ orders: formattedOrders }, { status: 200 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch orders";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
