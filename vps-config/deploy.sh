#!/bin/bash

# Exit script on any error
set -e

echo "🚀 Starting Deployment Process..."

# 1. Update Frontend
echo "📦 Installing Frontend Dependencies..."
cd frontend
npm install

echo "🏗️ Building Next.js App..."
npm run build
cd ..

# 2. Update Backend
echo "📦 Installing Backend Dependencies..."
cd backend
npm install
cd ..

# 3. Start or Restart PM2 processes
echo "🔄 Restarting PM2 processes..."
# If pm2 is not installed globally, install it: sudo npm i -g pm2
pm2 start ecosystem.config.js || pm2 restart ecosystem.config.js

# Save pm2 list so they resurrect on reboot
pm2 save

echo "✅ Deployment Successful!"
echo "Make sure NGINX is configured properly and reload it: sudo systemctl reload nginx"
