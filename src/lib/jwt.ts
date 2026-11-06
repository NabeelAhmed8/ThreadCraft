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

/**
 * Sign a JWT token for an authenticated user
 */
export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: JWT_EXPIRES_IN,
  });
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, getJwtSecret()) as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * Extract token from HTTP-only cookie or Authorization Bearer header
 */
export function extractTokenFromRequest(request: NextRequest): string | null {
  const cookieToken = request.cookies.get("token")?.value;
  if (cookieToken) return cookieToken;

  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7).trim();
  }

  return null;
}

/**
 * Retrieve authenticated user document from request token
 */
export async function getAuthUser(request: NextRequest): Promise<IUser | null> {
  const token = extractTokenFromRequest(request);
  if (!token) return null;

  const decoded = verifyToken(token);
  if (!decoded || !decoded.userId) return null;

  await connectToDatabase();
  return User.findById(decoded.userId);
}
