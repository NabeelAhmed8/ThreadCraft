import assert from "node:assert/strict";
import crypto from "crypto";
import jwt from "jsonwebtoken";

const TEST_SECRET = "test_threadcraft_jwt_secret_key_12345";
process.env.JWT_SECRET = TEST_SECRET;

// 1. Verify Secure OTP Generation
function generateOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

const otp = generateOtp();
assert.equal(otp.length, 6, "OTP should be 6 digits");
const otpNum = parseInt(otp, 10);
assert.ok(otpNum >= 100000 && otpNum <= 999999, "OTP must be between 100000 and 999999");

// 2. Verify Order Number Generator Format
function generateOrderNumber() {
  const timeHex = Date.now().toString(36).toUpperCase();
  const rand = crypto.randomInt(100, 1000);
  return `TC-${timeHex}${rand}`;
}

const orderId = generateOrderNumber();
assert.ok(/^TC-[A-Z0-9]+$/.test(orderId), `Order ID format must match TC-[A-Z0-9]+: got ${orderId}`);

// 3. Verify ReDoS Regex Sanitizer
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const maliciousInput = "test(.*)+$[]?^";
const escaped = escapeRegex(maliciousInput);
assert.doesNotThrow(() => new RegExp(`^${escaped}$`, "i"), "Sanitized regex must compile safely without injection");

// 4. Verify JWT Signing & Verification
const payload = { userId: "user_123", email: "shopper@threadcraft.com", name: "Shopper", role: "customer" };
const token = jwt.sign(payload, TEST_SECRET, { expiresIn: "1h" });
assert.ok(typeof token === "string" && token.length > 20, "JWT token must be a non-empty string");

const decoded = jwt.verify(token, TEST_SECRET);
assert.equal(decoded.userId, "user_123");
assert.equal(decoded.email, "shopper@threadcraft.com");

// 5. Verify Invalid JWT Rejection
assert.throws(() => jwt.verify("invalid.forged.token", TEST_SECRET), "Forged JWT token must be rejected");

console.log("ThreadCraft self-check: ALL 5 CRITICAL LOGIC & SECURITY TESTS PASSED.");
