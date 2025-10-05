import { test, expect, describe, beforeAll, afterAll } from 'bun:test';
import { generateOTP, isValidOTPFormat, isOTPExpired } from './lib/otp';

describe('OTP Utilities', () => {
  test('generateOTP returns 6-digit string', () => {
    const otp = generateOTP();
    expect(otp).toMatch(/^\d{6}$/);
    expect(otp.length).toBe(6);
  });

  test('isValidOTPFormat validates correctly', () => {
    expect(isValidOTPFormat('123456')).toBe(true);
    expect(isValidOTPFormat('000000')).toBe(true);
    expect(isValidOTPFormat('12345')).toBe(false);
    expect(isValidOTPFormat('1234567')).toBe(false);
    expect(isValidOTPFormat('abc123')).toBe(false);
    expect(isValidOTPFormat('')).toBe(false);
  });

  test('isOTPExpired works correctly', () => {
    const now = Date.now();
    const fiveMinutesAgo = now - 300000; // 5 minutes ago
    const oneMinuteAgo = now - 60000; // 1 minute ago

    expect(isOTPExpired(fiveMinutesAgo, 300000)).toBe(true);
    expect(isOTPExpired(oneMinuteAgo, 300000)).toBe(false);
    expect(isOTPExpired(now, 300000)).toBe(false);
  });
});

describe('Environment Configuration', () => {
  test('loadConfig throws error when TELEGRAM_BOT_TOKEN is missing', () => {
    const originalEnv = process.env.TELEGRAM_BOT_TOKEN;
    delete process.env.TELEGRAM_BOT_TOKEN;
    
    expect(() => {
      const { loadConfig } = require('./lib/env');
      loadConfig();
    }).toThrow('TELEGRAM_BOT_TOKEN is required');
    
    // Restore original value
    if (originalEnv) {
      process.env.TELEGRAM_BOT_TOKEN = originalEnv;
    }
  });
});