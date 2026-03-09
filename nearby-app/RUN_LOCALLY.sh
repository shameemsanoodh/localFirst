#!/bin/bash

echo "🚀 Starting NearBy Apps Locally"
echo "================================"
echo ""

# Check if backend is running
if ! lsof -i:3000 > /dev/null 2>&1; then
    echo "📦 Starting backend..."
    cd backend
    npm run offline > ../backend.log 2>&1 &
    BACKEND_PID=$!
    cd ..
    echo "✅ Backend starting (PID: $BACKEND_PID)"
    echo "   Logs: backend.log"
    sleep 5
else
    echo "✅ Backend already running on port 3000"
fi

# Check if merchant app is running
if ! lsof -i:5174 > /dev/null 2>&1; then
    echo "📦 Starting merchant app..."
    cd merchant-app
    npm run dev > ../merchant-app.log 2>&1 &
    MERCHANT_PID=$!
    cd ..
    echo "✅ Merchant app starting (PID: $MERCHANT_PID)"
    echo "   Logs: merchant-app.log"
    sleep 3
else
    echo "✅ Merchant app already running on port 5174"
fi

# Check if customer app is running
if ! lsof -i:5173 > /dev/null 2>&1; then
    echo "📦 Starting customer app..."
    cd customer-app
    npm run dev > ../customer-app.log 2>&1 &
    CUSTOMER_PID=$!
    cd ..
    echo "✅ Customer app starting (PID: $CUSTOMER_PID)"
    echo "   Logs: customer-app.log"
    sleep 3
else
    echo "✅ Customer app already running on port 5173"
fi

echo ""
echo "================================"
echo "🎉 ALL APPS RUNNING!"
echo "================================"
echo ""
echo "📱 Merchant App: http://localhost:5174"
echo "📱 Customer App: http://localhost:5173"
echo "🔧 Backend API: http://localhost:3000/dev"
echo ""
echo "📝 Test Credentials:"
echo "   Email: tech@example.com"
echo "   Passcode: 123456"
echo ""
echo "📊 View Logs:"
echo "   tail -f backend.log"
echo "   tail -f merchant-app.log"
echo "   tail -f customer-app.log"
echo ""
echo "🛑 Stop All:"
echo "   pkill -f 'serverless offline'"
echo "   pkill -f 'vite'"
echo ""
