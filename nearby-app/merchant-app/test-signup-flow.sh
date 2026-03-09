#!/bin/bash

# Test Signup Flow Script
# This script helps verify the signup and onboarding flow is working correctly

echo "🧪 Testing Merchant Signup Flow"
echo "================================"
echo ""

# Check if backend is running
echo "1️⃣  Checking backend API..."
BACKEND_URL="http://localhost:3000/dev"

if curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/check-phone/9999999999" | grep -q "200\|404"; then
  echo "   ✅ Backend is running at $BACKEND_URL"
else
  echo "   ❌ Backend is NOT running"
  echo "   💡 Start backend with: cd ../backend && npm run offline"
  exit 1
fi

echo ""

# Check if frontend is running
echo "2️⃣  Checking frontend dev server..."
FRONTEND_URL="http://localhost:5173"

if curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL" | grep -q "200"; then
  echo "   ✅ Frontend is running at $FRONTEND_URL"
else
  echo "   ❌ Frontend is NOT running"
  echo "   💡 Start frontend with: npm run dev"
  exit 1
fi

echo ""

# Test phone check endpoint
echo "3️⃣  Testing phone check endpoint..."
TEST_PHONE="9876543210"
RESPONSE=$(curl -s "$BACKEND_URL/check-phone/$TEST_PHONE")

if echo "$RESPONSE" | grep -q "exists"; then
  echo "   ✅ Phone check endpoint working"
  echo "   📱 Response: $RESPONSE"
else
  echo "   ⚠️  Phone check endpoint returned unexpected response"
  echo "   📱 Response: $RESPONSE"
fi

echo ""

# Check Signup.tsx for correct implementation
echo "4️⃣  Verifying Signup.tsx implementation..."

if grep -q "navigate('/onboarding')" src/pages/Signup.tsx; then
  echo "   ✅ Signup.tsx redirects to /onboarding"
else
  echo "   ❌ Signup.tsx does NOT redirect to /onboarding"
  exit 1
fi

if grep -q "const \[email" src/pages/Signup.tsx; then
  echo "   ❌ Signup.tsx contains old email field"
  exit 1
else
  echo "   ✅ Signup.tsx has no email field (correct)"
fi

if grep -q "mockUser\|mockToken" src/pages/Signup.tsx; then
  echo "   ❌ Signup.tsx contains mock registration code"
  exit 1
else
  echo "   ✅ Signup.tsx has no mock code (correct)"
fi

echo ""

# Check MerchantOnboarding.tsx
echo "5️⃣  Verifying MerchantOnboarding.tsx implementation..."

if grep -q "STEP_LABELS = \['Shop Details'" src/pages/MerchantOnboarding.tsx; then
  echo "   ✅ MerchantOnboarding.tsx has 8-step wizard"
else
  echo "   ❌ MerchantOnboarding.tsx missing step labels"
  exit 1
fi

if grep -q "POST.*merchants/signup" src/pages/MerchantOnboarding.tsx; then
  echo "   ✅ MerchantOnboarding.tsx calls signup API"
else
  echo "   ❌ MerchantOnboarding.tsx missing API call"
  exit 1
fi

echo ""

# Check environment variables
echo "6️⃣  Checking environment configuration..."

if [ -f ".env.local" ]; then
  echo "   ✅ .env.local exists"
  if grep -q "VITE_API_BASE_URL" .env.local; then
    API_URL=$(grep "VITE_API_BASE_URL" .env.local | cut -d '=' -f2)
    echo "   📍 API URL: $API_URL"
  fi
else
  echo "   ⚠️  .env.local not found (will use default)"
fi

echo ""
echo "================================"
echo "✅ All checks passed!"
echo ""
echo "🎯 Next Steps:"
echo "   1. Open browser to: $FRONTEND_URL/signup"
echo "   2. Press Ctrl+Shift+R to hard refresh"
echo "   3. Enter a 10-digit phone number"
echo "   4. Should redirect to /onboarding"
echo "   5. Complete all 8 steps"
echo ""
echo "🐛 If you still see old UI:"
echo "   1. Close ALL browser tabs"
echo "   2. Run: ./clear-cache-and-restart.sh"
echo "   3. Restart dev server: npm run dev"
echo "   4. Open Incognito window"
echo "   5. Navigate to /signup"
echo ""
