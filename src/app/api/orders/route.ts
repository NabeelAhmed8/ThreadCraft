import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Order } from "@/models/Order";

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

    return NextResponse.json(
      {
        success: true,
        orderId: newOrder.orderNumber,
        message: "Order placed and recorded in MongoDB successfully!",
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to record order in MongoDB";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function GET() {
  try {
    await connectToDatabase();
    const orders = await Order.find().sort({ createdAt: -1 }).limit(100).lean();

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
