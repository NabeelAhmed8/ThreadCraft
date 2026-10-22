import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "threadcraft_super_secret_jwt_key_2026";
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
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}
