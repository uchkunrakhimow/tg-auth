import { randomBytes } from 'crypto';

/**
 * Generate a secure 6-digit OTP code
 */
export function generateOTP(): string {
  // Generate 3 random bytes and convert to 6-digit number
  const bytes = randomBytes(3);
  const num = bytes.readUIntBE(0, 3);
  // Ensure it's 6 digits by using modulo 1000000
  return (num % 1000000).toString().padStart(6, '0');
}

/**
 * Validate OTP format (6 digits)
 */
export function isValidOTPFormat(code: string): boolean {
  return /^\d{6}$/.test(code);
}

/**
 * Check if OTP is expired
 */
export function isOTPExpired(createdAt: number, ttlMs: number): boolean {
  return Date.now() - createdAt >= ttlMs;
}