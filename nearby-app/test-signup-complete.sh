#!/bin/bash

# Complete Signup Testing Script
# This script helps test the complete signup flow

PHONE="${1:-9876543299}"

echo "🧪 Complete Signup Flow Test"
echo "================================"
echo "Phone: $PHONE"
echo ""

# Step 1: Clean up existing data
echo "1️⃣  Cleaning up existing data..."
cd backend
./cleanup-test-phone.sh "$PHONE"
cd ..
echo ""

# Step 2: Check backend is running
echo "2️⃣  Checking backend..."
if curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/dev/check-phone/$PHONE" | grep -q "200\|404"; then
  echo "   ✅ Backend is running"
else
  echo "   ❌ Backend is NOT running"
  echo "   💡 Start with: cd backend && npm run offline"
  exit 1
fi
echo ""

# Step 3: Check frontend is running
echo "3️⃣  Checking frontend..."
if curl -s -o /dev/null -w "%{http_code}" "http://localhost:5173" | grep -q "200"; then
  echo "   ✅ Frontend is running"
else
  echo "   ❌ Frontend is NOT running"
  echo "   💡 Start with: cd merchant-app && npm run dev"
  exit 1
fi
echo ""

# Step 4: Verify phone is clean
echo "4️⃣  Verifying phone is available..."
RESPONSE=$(curl -s "http://localhost:3000/dev/check-phone/$PHONE")
if echo "$RESPONSE" | grep -q '"exists":false'; then
  echo "   ✅ Phone is available for signup"
elif echo "$RESPONSE" | grep -q '"exists":true'; then
  echo "   ⚠️  Phone still exists in database"
  echo "   💡 Run cleanup again: cd backend && ./cleanup-test-phone.sh $PHONE"
  exit 1
else
  echo "   ⚠️  Unexpected response: $RESPONSE"
fi
echo ""

echo "================================"
echo "✅ Ready to test signup!"
echo ""
echo "📝 Manual Testing Steps:"
echo ""
echo "1. Open browser to: http://localhost:5173/signup"
echo "   - Press Ctrl+Shift+R to hard refresh"
echo ""
echo "2. Enter phone number: $PHONE"
echo "   - Should auto-check and redirect to /onboarding"
echo ""
echo "3. Complete Step 1: Shop Details"
echo "   - Shop Name: Test Shop"
echo "   - Owner Name: Test Owner"
echo "   - Email: test@example.com"
echo "   - Description: Test description"
echo "   - Address: Test address"
echo ""
echo "4. Complete Step 2: Category"
echo "   - Select any category (e.g., Kirana & Provision Stores)"
echo ""
echo "5. Complete Step 3: Subcategory"
echo "   - Select any subcategory"
echo ""
echo "6. Complete Step 4: Capabilities"
echo "   - Select at least one capability"
echo ""
echo "7. Complete Step 5: Location & Timings"
echo "   - Click 'Detect My Location' or enter manually"
echo "   - Set opening/closing times"
echo ""
echo "8. Complete Step 6: Passcode"
echo "   - Enter 6-digit passcode: 123456"
echo "   - Confirm: 123456"
echo "   - Click 'Launch My Shop'"
echo ""
echo "9. Watch for:"
echo "   - Step 7: Processing (loading spinner)"
echo "   - Step 8: Success (shows Merchant ID)"
echo "   - Auto-redirect to dashboard after 3s"
echo ""
echo "10. Check backend console for logs:"
echo "    - Should see: 'Merchant signup request received'"
echo "    - Should see: 'Signup completed successfully for merchant: MER-XXXXX'"
echo ""
echo "11. Check Network tab (DevTools):"
echo "    - POST /dev/merchants/signup"
echo "    - Status: 201 Created"
echo "    - Response includes merchantId and token"
echo ""
echo "🐛 If you see errors:"
echo "   - Check backend console for detailed logs"
echo "   - Check browser console for frontend errors"
echo "   - Check Network tab for API response"
echo "   - See SIGNUP_500_ERROR_FIX.md for troubleshooting"
echo ""
echo "🔄 To test again with same phone:"
echo "   ./test-signup-complete.sh $PHONE"
echo ""
