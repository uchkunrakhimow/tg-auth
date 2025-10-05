export interface TelegramUser {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
}

export interface OTPData {
  code: string;
  user: TelegramUser;
  createdAt: number;
  expiresAt: number;
}

export interface VerifyOTPRequest {
  code: string;
}

export interface VerifyOTPResponse {
  success: boolean;
  user?: TelegramUser;
  message?: string;
}

export interface RateLimitData {
  count: number;
  resetTime: number;
}

export interface RedisConfig {
  host: string;
  port: number;
}

export interface AppConfig {
  telegramBotToken: string;
  redis: RedisConfig;
  serverPort: number;
  rateLimitWindow: number;
}