#!/bin/bash
set -e

echo "🚀 Deploying Lightsail Manager..."

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found!"
    echo "Please copy .env.example to .env and configure it:"
    echo "  cp .env.example .env"
    exit 1
fi

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull

# Install dependencies
echo "📦 Installing dependencies..."
npm run install-all

# Build frontend
echo "🏗️  Building frontend..."
npm run build-frontend

# Restart PM2
echo "🔄 Restarting PM2 process..."
pm2 restart lightsail-manager || pm2 start backend/server.js --name "lightsail-manager"

echo "✅ Deployment complete!"
echo ""
echo "📊 PM2 Status:"
pm2 status
