#!/bin/bash

echo "🚀 Setting up Telegram OTP Authentication Backend"
echo "================================================"

# Check if Bun is installed
if ! command -v bun &> /dev/null; then
    echo "❌ Bun is not installed. Please install Bun first:"
    echo "   curl -fsSL https://bun.sh/install | bash"
    exit 1
fi

echo "✅ Bun is installed: $(bun --version)"

# Check if Redis is running
if ! redis-cli ping &> /dev/null; then
    echo "⚠️  Redis is not running. Please start Redis:"
    echo "   # Using Docker:"
    echo "   docker run -d -p 6379:6379 redis:alpine"
    echo ""
    echo "   # Or install and start locally:"
    echo "   redis-server"
    echo ""
    read -p "Press Enter to continue after starting Redis..."
fi

# Install dependencies
echo "📦 Installing dependencies..."
bun install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file and add your Telegram bot token"
    echo "   Get your bot token from: https://t.me/BotFather"
else
    echo "✅ .env file already exists"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file and add your TELEGRAM_BOT_TOKEN"
echo "2. Start the application: bun run start"
echo "3. Open example-frontend.html in your browser"
echo "4. Send /start to your Telegram bot to get an OTP code"
echo ""
echo "For more information, see README.md"