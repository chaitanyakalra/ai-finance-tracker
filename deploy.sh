#!/bin/bash

# Deployment script for FinanceGuard AI
# This script uploads the built frontend to your server

SERVER_IP="13.200.222.100"
SERVER_USER="ubuntu"  # Change this to your server username
WEB_ROOT="/var/www/html"  # Change this to your web root path

echo "🚀 Deploying FinanceGuard AI to $SERVER_IP"
echo "================================================"

# Check if dist folder exists
if [ ! -d "frontend/dist" ]; then
    echo "❌ Error: frontend/dist folder not found!"
    echo "Please run 'cd frontend && npm run build' first"
    exit 1
fi

echo "📦 Found build files in frontend/dist"
echo ""

# Upload files using SCP
echo "📤 Uploading files to server..."
scp -r frontend/dist/* $SERVER_USER@$SERVER_IP:$WEB_ROOT/

if [ $? -eq 0 ]; then
    echo "✅ Files uploaded successfully!"
    echo ""
    echo "🌐 Your website should now be live at:"
    echo "   http://$SERVER_IP"
    echo ""
    echo "💡 If changes don't appear, try:"
    echo "   1. Clear your browser cache (Ctrl+Shift+R)"
    echo "   2. Open in incognito mode"
    echo "   3. Wait a few seconds for CDN to update"
else
    echo "❌ Upload failed!"
    echo "Please check your SSH credentials and server access"
fi
