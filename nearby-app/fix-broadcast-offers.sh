#!/bin/bash

echo "🔧 Fixing Merchant Broadcast Offers..."
echo ""

cd backend

echo "📦 Installing dependencies (if needed)..."
npm install

echo ""
echo "🔨 Building TypeScript files..."
npm run build

echo ""
echo "✅ Build complete!"
echo ""
echo "Now restart the backend:"
echo "  cd backend"
echo "  npm run offline"
echo ""
