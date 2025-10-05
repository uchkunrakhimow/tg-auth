import { createHash as nodeCreateHash, randomBytes } from "crypto";

/**
 * Generate a cryptographically secure random string
 */
export function generateSecureToken(length: number = 32): string {
  return randomBytes(length).toString("hex");
}

/**
 * Create a hash of the input string
 */
export function sha256(input: string): string {
  return nodeCreateHash("sha256").update(input).digest("hex");
}

/**
 * Sanitize user input to prevent injection attacks
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, "") // Remove potential HTML tags
    .replace(/['"]/g, "") // Remove quotes
    .trim()
    .substring(0, 100); // Limit length
}

/**
 * Validate that a string contains only safe characters
 */
export function isSafeString(input: string): boolean {
  return /^[a-zA-Z0-9\s\-_@.]+$/.test(input);
}

/**
 * Rate limiting helper - check if enough time has passed
 */
export function canProceedWithRateLimit(
  lastAttempt: number,
  cooldownMs: number
): boolean {
  return Date.now() - lastAttempt >= cooldownMs;
}
