import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAddress {
  _id?: string;
  id?: string;
  label: string;
  recipientName: string;
  phone: string;
  street: string;
  apartment?: string;
  city: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export interface IPaymentMethod {
  _id?: string;
  id?: string;
  cardHolder: string;
  cardType: string;
  last4: string;
  expiry: string;
  isDefault: boolean;
}

export interface IUser extends Document {
  name: string;
  email: string;
  phone?: string;
  password?: string;
  role: "customer" | "admin";
  isVerified: boolean;
  verificationCode?: string;
  verificationCodeExpires?: Date;
  addresses: IAddress[];
  paymentMethods: IPaymentMethod[];
  createdAt: Date;
  updatedAt: Date;
}

const AddressSchema = new Schema<IAddress>(
  {
    label: { type: String, default: "Home" },
    recipientName: { type: String, required: true },
    phone: { type: String, required: true },
    street: { type: String, required: true },
    apartment: { type: String, default: "" },
    city: { type: String, required: true },
    postalCode: { type: String, default: "" },
    country: { type: String, default: "Pakistan" },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true, timestamps: true }
);

const PaymentMethodSchema = new Schema<IPaymentMethod>(
  {
    cardHolder: { type: String, required: true },
    cardType: { type: String, default: "Visa" },
    last4: { type: String, required: true },
    expiry: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true, timestamps: true }
);

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid email address",
      ],
    },
    phone: {
      type: String,
      default: "",
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
    },
    role: {
      type: String,
      enum: ["customer", "admin"],
      default: "customer",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationCode: {
      type: String,
      default: null,
    },
    verificationCodeExpires: {
      type: Date,
      default: null,
    },
    addresses: {
      type: [AddressSchema],
      default: [],
    },
    paymentMethods: {
      type: [PaymentMethodSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

if (process.env.NODE_ENV !== "production") {
  delete mongoose.models.User;
}

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
