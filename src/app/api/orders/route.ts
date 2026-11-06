import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { connectToDatabase } from "@/lib/mongodb";
import { Order, IOrderItem } from "@/models/Order";
import { Product } from "@/models/Product";
import { User, IAddress, IPaymentMethod } from "@/models/User";
import { extractTokenFromRequest, verifyToken } from "@/lib/jwt";

function generateOrderNumber(): string {
  const timeHex = Date.now().toString(36).toUpperCase();
  const rand = crypto.randomInt(100, 1000);
  return `TC-${timeHex}${rand}`;
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0 || !body.customer) {
      return NextResponse.json(
        { error: "Cart items and customer details are required." },
        { status: 400 }
      );
    }

    // Server-side Catalog Price & Stock Verification
    const productIds = body.items.map((i: { productId?: string; id?: string }) => i.productId || i.id).filter(Boolean);
    const dbProducts = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map(dbProducts.map((p) => [p._id.toString(), p]));

    const verifiedItems: IOrderItem[] = [];
    let verifiedSubtotal = 0;

    for (const item of body.items) {
      const targetId = (item.productId || item.id || "").toString();
      const product = productMap.get(targetId);

      if (!product) {
        return NextResponse.json(
          { error: `Item "${item.name || targetId}" is no longer available in the store.` },
          { status: 400 }
        );
      }

      const qty = Math.max(1, parseInt(item.quantity || "1", 10));
      if (!product.inStock || product.stockCount < qty) {
        return NextResponse.json(
          { error: `"${product.name}" is currently out of stock or does not have enough inventory.` },
          { status: 400 }
        );
      }

      const verifiedPrice = Number(product.price);
      verifiedSubtotal += verifiedPrice * qty;

      verifiedItems.push({
        productId: product._id.toString(),
        name: product.name,
        price: verifiedPrice,
        image: item.image || (product.images && product.images[0]) || "",
        size: item.size || "M",
        color: item.color || "",
        quantity: qty,
      });
    }

    const shipping = Number(body.shipping) > 0 ? Number(body.shipping) : 0;
    const verifiedTotal = verifiedSubtotal + shipping;
    const orderNumber = generateOrderNumber();

    const newOrder = await Order.create({
      orderNumber,
      customer: body.customer,
      items: verifiedItems,
      subtotal: verifiedSubtotal,
      shipping,
      total: verifiedTotal,
      paymentMethod: body.paymentMethod || "cod",
      notes: body.notes || "",
    });

    // Decrement inventory stock atomically
    for (const item of verifiedItems) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stockCount: -item.quantity },
      });
    }

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
    const token = extractTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to view orders." },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.email) {
      return NextResponse.json(
        { error: "Invalid or expired session token." },
        { status: 401 }
      );
    }

    await connectToDatabase();

    // Admin can query any customer email or view all orders; customers can only view their own orders
    let query: Record<string, unknown> = {};
    if (decoded.role === "admin") {
      const email = request.nextUrl.searchParams.get("email");
      if (email) {
        query = { "customer.email": email.toLowerCase().trim() };
      }
    } else {
      query = { "customer.email": decoded.email.toLowerCase().trim() };
    }

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
