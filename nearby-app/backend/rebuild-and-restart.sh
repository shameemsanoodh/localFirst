#!/bin/bash

# Rebuild and Restart Backend Script
# This script rebuilds the TypeScript code and restarts serverless offline

echo "🔨 Rebuilding backend..."
echo ""

# Build TypeScript
npm run build

if [ $? -ne 0 ]; then
  echo ""
  echo "❌ Build failed!"
  echo "Please fix TypeScript errors and try again."
  exit 1
fi

echo ""
echo "✅ Build successful!"
echo ""
echo "📝 New endpoint available:"
echo "   POST /dev/utils/resolve-map-link"
echo ""
echo "🚀 Starting serverless offline..."
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start serverless offline
npm run offline
