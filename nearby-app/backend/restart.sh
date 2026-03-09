#!/bin/bash

echo "🔄 Restarting Serverless Offline..."
echo ""

# Kill any existing serverless processes
echo "Stopping existing processes..."
pkill -f "serverless offline" || true
pkill -f "serverless-offline" || true
sleep 2

# Rebuild
echo "Rebuilding TypeScript..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo ""
echo "✓ Build successful"
echo ""
echo "Starting serverless offline..."
echo "================================"
echo ""

# Start serverless offline
npm run offline
