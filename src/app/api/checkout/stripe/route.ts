import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { connectToDatabase } from "@/lib/mongodb";
import { Order, IOrderItem } from "@/models/Order";
import { Product } from "@/models/Product";
import { User, IAddress } from "@/models/User";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

function getStripeKey(): string {
  if (!STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY environment variable is missing.");
  }
  return STRIPE_SECRET_KEY;
}

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

    // 1. Verify Catalog Prices & Stock
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

    // 2. Pre-record Pending Order in MongoDB
    await Order.create({
      orderNumber,
      customer: body.customer,
      items: verifiedItems,
      subtotal: verifiedSubtotal,
      shipping,
      total: verifiedTotal,
      paymentMethod: "stripe",
      paymentStatus: "pending",
      orderStatus: "received",
      notes: body.notes || "",
    });

    // 3. Atomically decrement inventory stock
    for (const item of verifiedItems) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stockCount: -item.quantity },
      });
    }

    // 4. Sync Address to User Profile
    if (body.customer?.email) {
      try {
        const normalizedEmail = body.customer.email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });
        if (user && body.customer.address && body.customer.city) {
          const incomingStreet = body.customer.address.toLowerCase().trim();
          const incomingCity = body.customer.city.toLowerCase().trim();
          const addressExists = user.addresses.some(
            (a: IAddress) =>
              a.street.toLowerCase().trim() === incomingStreet &&
              a.city.toLowerCase().trim() === incomingCity
          );
          if (!addressExists) {
            user.addresses.push({
              label: user.addresses.length === 0 ? "Default" : `Shipping ${user.addresses.length + 1}`,
              recipientName: body.customer.fullName || user.name,
              phone: body.customer.phone || user.phone || "",
              street: body.customer.address.trim(),
              city: body.customer.city.trim(),
              postalCode: body.customer.postalCode ? body.customer.postalCode.trim() : "",
              country: body.customer.country ? body.customer.country.trim() : "Pakistan",
              isDefault: user.addresses.length === 0,
            });
            await user.save();
          }
        }
      } catch (e) {
        console.error("Profile sync notice:", e);
      }
    }

    // 5. In-Page PaymentIntent Mode (Stripe Embedded / Elements)
    if (body.mode === "intent") {
      const intentParams = new URLSearchParams();
      intentParams.append("amount", Math.round(verifiedTotal * 100).toString());
      intentParams.append("currency", "usd");
      intentParams.append("automatic_payment_methods[enabled]", "true");
      intentParams.append("metadata[orderNumber]", orderNumber);
      intentParams.append("metadata[customerName]", body.customer.fullName || "");
      intentParams.append("metadata[customerPhone]", body.customer.phone || "");
      intentParams.append("metadata[deliveryAddress]", `${body.customer.address || ""}, ${body.customer.city || ""}`);

      const intentRes = await fetch("https://api.stripe.com/v1/payment_intents", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getStripeKey()}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: intentParams,
      });

      const intentData = await intentRes.json();
      if (!intentRes.ok || !intentData.client_secret) {
        throw new Error(intentData.error?.message || "Failed to create Stripe Payment Intent.");
      }

      return NextResponse.json({
        success: true,
        clientSecret: intentData.client_secret,
        orderNumber,
      });
    }

    // 6. Build Hosted Stripe Checkout Session as fallback
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || request.headers.get("origin") || "http://localhost:3000";
    const params = new URLSearchParams();

    params.append("payment_method_types[]", "card");
    params.append("mode", "payment");
    params.append("success_url", `${siteUrl}/checkout?session_id={CHECKOUT_SESSION_ID}`);
    params.append("cancel_url", `${siteUrl}/checkout?canceled=true`);
    params.append("customer_email", body.customer.email.toLowerCase().trim());
    params.append("metadata[orderNumber]", orderNumber);
    params.append("metadata[customerName]", body.customer.fullName || "");
    params.append("metadata[customerPhone]", body.customer.phone || "");
    params.append("metadata[deliveryAddress]", `${body.customer.address || ""}, ${body.customer.city || ""}`);

    verifiedItems.forEach((item, idx) => {
      params.append(`line_items[${idx}][price_data][currency]`, "usd");
      params.append(`line_items[${idx}][price_data][product_data][name]`, item.name);
      params.append(`line_items[${idx}][price_data][unit_amount]`, Math.round(item.price * 100).toString());
      params.append(`line_items[${idx}][quantity]`, item.quantity.toString());
    });

    if (shipping > 0) {
      const shipIdx = verifiedItems.length;
      params.append(`line_items[${shipIdx}][price_data][currency]`, "usd");
      params.append(`line_items[${shipIdx}][price_data][product_data][name]`, "Standard Shipping");
      params.append(`line_items[${shipIdx}][price_data][unit_amount]`, Math.round(shipping * 100).toString());
      params.append(`line_items[${shipIdx}][quantity]`, "1");
    }

    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getStripeKey()}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });

    const session = await stripeRes.json();

    if (!stripeRes.ok || !session.url) {
      throw new Error(session.error?.message || "Failed to initialize Stripe Checkout Session.");
    }

    return NextResponse.json(
      {
        success: true,
        url: session.url,
        orderNumber,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Stripe checkout failed.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get("session_id");
    if (!sessionId) {
      return NextResponse.json({ error: "Missing session_id parameter." }, { status: 400 });
    }

    // Verify session with Stripe
    const stripeRes = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
      headers: {
        Authorization: `Bearer ${getStripeKey()}`,
      },
    });

    const session = await stripeRes.json();

    if (!stripeRes.ok) {
      return NextResponse.json({ error: session.error?.message || "Invalid Stripe session." }, { status: 400 });
    }

    const isPaid = session.payment_status === "paid";
    const orderNumber = session.metadata?.orderNumber;

    if (isPaid && orderNumber) {
      await connectToDatabase();
      await Order.findOneAndUpdate(
        { orderNumber },
        { paymentStatus: "paid", orderStatus: "processing" }
      );
    }

    return NextResponse.json({
      success: true,
      paid: isPaid,
      orderNumber,
      amountTotal: session.amount_total ? session.amount_total / 100 : 0,
      customerEmail: session.customer_email || session.customer_details?.email,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error verifying Stripe session.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
