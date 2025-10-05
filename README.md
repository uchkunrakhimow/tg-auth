# Telegram OTP Authentication Backend

A production-ready Telegram-based OTP authentication backend built with **Bun**, **Telegraf**, and **Redis**. This system allows users to authenticate via 6-digit OTP codes sent through a Telegram bot.

## 🚀 Features

- **Secure OTP Generation**: Cryptographically secure 6-digit codes
- **Telegram Bot Integration**: Uses Telegraf for bot functionality
- **Redis Storage**: Native Bun TCP socket implementation for Redis
- **Rate Limiting**: Prevents spam (1 OTP per user per minute)
- **One-time Use**: OTPs are deleted after verification
- **Auto-expiration**: 5-minute TTL on all OTP codes
- **CORS Support**: Ready for web frontend integration
- **Health Monitoring**: Built-in health check endpoint
- **Graceful Shutdown**: Proper cleanup on termination

## 📋 Prerequisites

- [Bun](https://bun.sh) (latest version)
- [Redis](https://redis.io) server running locally or remotely
- [Telegram Bot Token](https://core.telegram.org/bots#creating-a-new-bot)

## 🛠️ Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd tg-auth
   bun install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
   REDIS_HOST=127.0.0.1
   REDIS_PORT=6379
   SERVER_PORT=3000
   RATE_LIMIT_WINDOW=60000
   ```

3. **Start Redis server:**
   ```bash
   # Using Docker
   docker run -d -p 6379:6379 redis:alpine
   
   # Or install locally
   redis-server
   ```

## 🚀 Usage

### Start the application:
```bash
bun run start
# or for development with hot reload
bun run dev
```

### Expected output:
```
🚀 Starting Telegram OTP Authentication Backend...

✅ Configuration loaded
✅ Connected to Redis at 127.0.0.1:6379
🤖 Telegram bot started successfully
🚀 API server running on http://localhost:3000
📊 Health check: http://localhost:3000/health
🔐 OTP verification: http://localhost:3000/api/verify-otp

🎉 All services started successfully!
📱 Telegram bot is listening for /start commands
🌐 API server is running on port 3000
🔗 Redis connection established
```

## 📱 Telegram Bot Usage

1. **Start a conversation** with your bot on Telegram
2. **Send `/start`** to generate an OTP code
3. **Receive a 6-digit code** that expires in 5 minutes
4. **Use the code** in your web application

### Bot Commands:
- `/start` - Generate a new OTP code
- `/help` - Show help information

## 🌐 API Endpoints

### Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### Verify OTP
```http
POST /api/verify-otp
Content-Type: application/json

{
  "code": "123456"
}
```

**Success Response:**
```json
{
  "success": true,
  "user": {
    "id": 123456789,
    "username": "johndoe",
    "first_name": "John",
    "last_name": "Doe",
    "full_name": "John Doe"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Invalid or expired code"
}
```

## 🔒 Security Features

- **Cryptographically Secure OTPs**: Uses `crypto.randomBytes()` for generation
- **One-time Use**: OTPs are deleted immediately after verification
- **Rate Limiting**: 1 OTP per user per minute
- **Auto-expiration**: 5-minute TTL on all codes
- **Input Validation**: Strict format validation for OTP codes
- **Error Handling**: No sensitive information in error messages

## 🏗️ Architecture

```
src/
├── bot/
│   └── index.ts        # Telegraf bot logic
├── api/
│   └── server.ts       # Bun HTTP API server
├── lib/
│   ├── redis.ts        # Native Redis client
│   ├── otp.ts          # OTP generation utilities
│   ├── security.ts     # Security helpers
│   └── env.ts          # Environment configuration
├── types/
│   └── index.ts        # TypeScript interfaces
└── index.ts            # Application entry point
```

## 🔧 Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `TELEGRAM_BOT_TOKEN` | Your Telegram bot token | Required |
| `REDIS_HOST` | Redis server hostname | `127.0.0.1` |
| `REDIS_PORT` | Redis server port | `6379` |
| `SERVER_PORT` | API server port | `3000` |
| `RATE_LIMIT_WINDOW` | Rate limit window in ms | `60000` |

## 🧪 Testing

Test the API endpoints:

```bash
# Health check
curl http://localhost:3000/health

# Verify OTP (replace with actual code from bot)
curl -X POST http://localhost:3000/api/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"code": "123456"}'
```

## 🚀 Deployment

### Using Docker:

1. **Create Dockerfile:**
   ```dockerfile
   FROM oven/bun:1 as base
   WORKDIR /app
   COPY package.json bun.lockb ./
   RUN bun install --frozen-lockfile
   COPY . .
   EXPOSE 3000
   CMD ["bun", "run", "start"]
   ```

2. **Build and run:**
   ```bash
   docker build -t tg-auth .
   docker run -p 3000:3000 --env-file .env tg-auth
   ```

### Using PM2:
```bash
bun install -g pm2
pm2 start "bun run start" --name tg-auth
```

## 🔍 Monitoring

- **Health Check**: `GET /health` for service status
- **Logs**: Structured logging with emojis for easy reading
- **Redis Monitoring**: Connection status and error handling
- **Rate Limiting**: Built-in protection against abuse

## 🛠️ Development

```bash
# Install dependencies
bun install

# Run in development mode
bun run dev

# Build for production
bun run build

# Run tests
bun test
```

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 🆘 Troubleshooting

### Common Issues:

1. **Redis Connection Failed**
   - Ensure Redis server is running
   - Check `REDIS_HOST` and `REDIS_PORT` in `.env`

2. **Telegram Bot Not Responding**
   - Verify `TELEGRAM_BOT_TOKEN` is correct
   - Check bot permissions and webhook settings

3. **OTP Verification Fails**
   - Ensure OTP is used within 5 minutes
   - Check that OTP hasn't been used already
   - Verify OTP format (6 digits)

### Debug Mode:
Set `NODE_ENV=development` for verbose logging.

---

**Built with ❤️ using Bun, Telegraf, and Redis**