import { Telegraf } from 'telegraf';
import type { TelegramUser } from '../types';
import { generateOTP } from '../lib/otp';
import { RedisClient } from '../lib/redis';

export class TelegramBot {
  private bot: Telegraf;
  private redis: RedisClient;

  constructor(token: string, redis: RedisClient) {
    this.bot = new Telegraf(token);
    this.redis = redis;
    this.setupHandlers();
  }

  private setupHandlers(): void {
    this.bot.start(async (ctx) => {
      try {
        const user = ctx.from;
        if (!user) {
          await ctx.reply('❌ Unable to identify user. Please try again.');
          return;
        }

        // Check rate limit (1 OTP per minute per user)
        const canProceed = await this.redis.checkRateLimit(user.id, 60000);
        if (!canProceed) {
          await ctx.reply('⏰ Please wait 1 minute before requesting another OTP code.');
          return;
        }

        // Generate OTP
        const otpCode = generateOTP();
        
        // Prepare user data
        const userData: TelegramUser = {
          id: user.id,
          username: user.username,
          first_name: user.first_name,
          last_name: user.last_name,
          full_name: [user.first_name, user.last_name].filter(Boolean).join(' '),
        };

        // Store OTP in Redis with 5-minute TTL
        const success = await this.redis.storeOTP(otpCode, userData, 300);
        
        if (!success) {
          await ctx.reply('❌ Failed to generate OTP. Please try again.');
          return;
        }

        // Send OTP to user
        await ctx.reply(
          `🔐 Your OTP code is: **${otpCode}**\n\n` +
          `⏰ This code will expire in 5 minutes.\n` +
          `🔒 Use this code to authenticate on the web application.\n\n` +
          `⚠️ Do not share this code with anyone.`,
          { parse_mode: 'Markdown' }
        );

        console.log(`📱 OTP generated for user ${user.id} (${userData.full_name}): ${otpCode}`);
      } catch (error) {
        console.error('❌ Error in /start handler:', error);
        await ctx.reply('❌ An error occurred. Please try again later.');
      }
    });

    this.bot.help(async (ctx) => {
      await ctx.reply(
        '🤖 **Telegram OTP Bot**\n\n' +
        'Available commands:\n' +
        '• /start - Generate a new OTP code\n' +
        '• /help - Show this help message\n\n' +
        'This bot generates secure OTP codes for web authentication.',
        { parse_mode: 'Markdown' }
      );
    });

    // Handle unknown commands
    this.bot.on('text', async (ctx) => {
      const message = ctx.message;
      if ('text' in message) {
        await ctx.reply(
          '❓ Unknown command. Use /start to generate an OTP code or /help for more information.'
        );
      }
    });

    // Error handling
    this.bot.catch((err: any, ctx: any) => {
      console.error('❌ Bot error:', err);
      ctx.reply('❌ An error occurred. Please try again later.');
    });
  }

  async start(): Promise<void> {
    try {
      await this.bot.launch();
      console.log('🤖 Telegram bot started successfully');
      
      // Graceful shutdown
      process.once('SIGINT', () => this.stop());
      process.once('SIGTERM', () => this.stop());
    } catch (error) {
      console.error('❌ Failed to start Telegram bot:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    try {
      await this.bot.stop('SIGINT');
      console.log('🛑 Telegram bot stopped');
    } catch (error) {
      console.error('❌ Error stopping bot:', error);
    }
  }
}