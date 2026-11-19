import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User, IUser } from "@/models/User";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("Critical security error: JWT_SECRET environment variable is missing.");
  }
  return secret;
}

const JWT_EXPIRES_IN = "7d";

export interface JWTPayload {
  userId: string;
  email: string;
  name: string;
  role?: string;
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: JWT_EXPIRES_IN,
  });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, getJwtSecret()) as JWTPayload;
  } catch {
    return null;
  }
}

export function extractTokenFromRequest(request: NextRequest): string | null {
  const cookieToken = request.cookies.get("token")?.value;
  if (cookieToken) return cookieToken;

  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7).trim();
  }

  return null;
}

export async function getAuthUser(request: NextRequest): Promise<IUser | null> {
  const token = extractTokenFromRequest(request);
  if (!token) return null;

  const decoded = verifyToken(token);
  if (!decoded || !decoded.userId) return null;

  await connectToDatabase();
  return User.findById(decoded.userId);
}
