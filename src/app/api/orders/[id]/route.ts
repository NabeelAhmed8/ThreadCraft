import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Order } from "@/models/Order";
import { extractTokenFromRequest, verifyToken } from "@/lib/jwt";
import mongoose from "mongoose";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = extractTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: "Invalid or expired session token." },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;

    await connectToDatabase();

    let query: Record<string, unknown> = {};
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { _id: id };
    } else {
      query = { orderNumber: id };
    }

    const order = await Order.findOne(query).lean();
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (decoded.role !== "admin" && order.customer.email.toLowerCase() !== decoded.email.toLowerCase()) {
      return NextResponse.json({ error: "Forbidden. Access denied." }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      order: {
        ...order,
        id: order._id.toString(),
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to retrieve order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = extractTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized. Admin privileges required." },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden. Admin privileges required." },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;

    await connectToDatabase();

    const body = await request.json();
    const updateFields: Record<string, unknown> = {};

    if (body.orderStatus) {
      const validStatuses = ["received", "processing", "shipped", "delivered", "cancelled"];
      if (!validStatuses.includes(body.orderStatus)) {
        return NextResponse.json(
          { error: `Invalid orderStatus. Allowed values: ${validStatuses.join(", ")}` },
          { status: 400 }
        );
      }
      updateFields.orderStatus = body.orderStatus;
    }

    if (body.paymentStatus) {
      const validPayment = ["pending", "paid", "failed"];
      if (!validPayment.includes(body.paymentStatus)) {
        return NextResponse.json(
          { error: `Invalid paymentStatus. Allowed values: ${validPayment.join(", ")}` },
          { status: 400 }
        );
      }
      updateFields.paymentStatus = body.paymentStatus;
    }

    let query: Record<string, unknown> = {};
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { _id: id };
    } else {
      query = { orderNumber: id };
    }

    const updatedOrder = await Order.findOneAndUpdate(query, updateFields, {
      new: true,
      runValidators: true,
    }).lean();

    if (!updatedOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Order updated successfully",
      order: {
        ...updatedOrder,
        id: updatedOrder._id.toString(),
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to update order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
