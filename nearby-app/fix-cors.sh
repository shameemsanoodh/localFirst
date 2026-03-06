#!/bin/bash

# Quick CORS Fix Script
# Redeploys backend with updated CORS configuration

set -e

echo "🔧 Fixing CORS Issues..."
echo ""

cd backend

echo "📦 Installing dependencies..."
npm install

echo "🔨 Building backend..."
npm run build

echo "🚀 Deploying backend with CORS fixes..."
npm run deploy

echo ""
echo "✅ CORS fixes deployed!"
echo ""
echo "Test the API:"
echo "curl -X OPTIONS https://YOUR_API_URL/dev/ai/analyze-image -v"
echo ""
