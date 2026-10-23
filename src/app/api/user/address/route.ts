import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User, IAddress } from "@/models/User";
import { verifyToken } from "@/lib/jwt";
import mongoose from "mongoose";

async function getAuthUser(request: NextRequest) {
  const token =
    request.cookies.get("token")?.value ||
    (request.headers.get("authorization")?.startsWith("Bearer ")
      ? request.headers.get("authorization")?.split(" ")[1]
      : null);

  if (!token) return null;
  const decoded = verifyToken(token);
  if (!decoded || !decoded.userId) return null;

  await connectToDatabase();
  return User.findById(decoded.userId);
}

// POST: Add new address or update existing
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
    const {
      addressId,
      label,
      recipientName,
      phone,
      street,
      apartment,
      city,
      postalCode,
      country,
      isDefault,
    } = body;

    if (!recipientName || !phone || !street || !city) {
      return NextResponse.json(
        { error: "Recipient name, phone, street, and city are required." },
        { status: 400 }
      );
    }

    // If marked default, unset default on other addresses
    if (isDefault) {
      user.addresses.forEach((addr: IAddress) => {
        addr.isDefault = false;
      });
    }

    if (addressId) {
      // Update existing address
      const existing = (user.addresses as mongoose.Types.DocumentArray<IAddress & mongoose.Document>).id(addressId);
      if (existing) {
        existing.label = label || "Home";
        existing.recipientName = recipientName;
        existing.phone = phone;
        existing.street = street;
        existing.apartment = apartment || "";
        existing.city = city;
        existing.postalCode = postalCode || "";
        existing.country = country || "Pakistan";
        existing.isDefault = !!isDefault;
      }
    } else {
      // Add new address
      const isFirst = user.addresses.length === 0;
      user.addresses.push({
        label: label || "Home",
        recipientName,
        phone,
        street,
        apartment: apartment || "",
        city,
        postalCode: postalCode || "",
        country: country || "Pakistan",
        isDefault: isFirst || !!isDefault,
      });
    }

    await user.save();

    return NextResponse.json({
      success: true,
      message: addressId ? "Address updated successfully!" : "New address added!",
      addresses: user.addresses,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error saving address";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE: Remove address by addressId
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
    const { addressId } = body;

    if (!addressId) {
      return NextResponse.json(
        { error: "addressId is required." },
        { status: 400 }
      );
    }

    const docArray = user.addresses as mongoose.Types.DocumentArray<IAddress & mongoose.Document>;
    const target = docArray.id(addressId);
    if (target) {
      const wasDefault = target.isDefault;
      target.deleteOne();
      if (wasDefault && user.addresses.length > 0) {
        user.addresses[0].isDefault = true;
      }
    }

    await user.save();

    return NextResponse.json({
      success: true,
      message: "Address removed successfully.",
      addresses: user.addresses,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error deleting address";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
