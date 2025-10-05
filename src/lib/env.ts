import type { AppConfig } from '../types';

export function loadConfig(): AppConfig {
  const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!telegramBotToken) {
    throw new Error('TELEGRAM_BOT_TOKEN is required');
  }

  const redisHost = process.env.REDIS_HOST || '127.0.0.1';
  const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
  const serverPort = parseInt(process.env.SERVER_PORT || '3000', 10);
  const rateLimitWindow = parseInt(process.env.RATE_LIMIT_WINDOW || '60000', 10);

  return {
    telegramBotToken,
    redis: {
      host: redisHost,
      port: redisPort,
    },
    serverPort,
    rateLimitWindow,
  };
}