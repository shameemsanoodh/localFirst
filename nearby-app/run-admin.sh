#!/bin/bash

echo "🚀 Starting NearBy Admin Dashboard..."
echo ""

cd admin-app

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

echo "✅ Starting development server..."
echo "📍 Admin dashboard will be available at: http://localhost:5174"
echo ""
echo "🔐 Login credentials:"
echo "   Username: admin"
echo "   Password: admin123"
echo ""

npm run dev
