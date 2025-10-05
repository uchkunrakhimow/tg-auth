import { loadConfig } from './lib/env';
import { RedisClient } from './lib/redis';
import { TelegramBot } from './bot/index';
import { APIServer } from './api/server';

async function main() {
  console.log('🚀 Starting Telegram OTP Authentication Backend...\n');

  try {
    // Load configuration
    const config = loadConfig();
    console.log('✅ Configuration loaded');

    // Initialize Redis client
    const redis = new RedisClient(config.redis);
    await redis.connect();

    // Initialize and start Telegram bot
    const bot = new TelegramBot(config.telegramBotToken, redis);
    await bot.start();

    // Initialize and start API server
    const apiServer = new APIServer(redis, config.serverPort);
    await apiServer.start();

    console.log('\n🎉 All services started successfully!');
    console.log('📱 Telegram bot is listening for /start commands');
    console.log(`🌐 API server is running on port ${config.serverPort}`);
    console.log('🔗 Redis connection established');
    console.log('\n📋 Available endpoints:');
    console.log(`   GET  http://localhost:${config.serverPort}/health`);
    console.log(`   POST http://localhost:${config.serverPort}/api/verify-otp`);
    console.log('\n💡 Send /start to your Telegram bot to generate an OTP code');

    // Graceful shutdown handling
    const shutdown = async (signal: string) => {
      console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
      
      try {
        await bot.stop();
        await redis.disconnect();
        console.log('✅ Shutdown complete');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

  } catch (error) {
    console.error('❌ Failed to start application:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the application
main().catch((error) => {
  console.error('❌ Application startup failed:', error);
  process.exit(1);
});