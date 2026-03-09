#!/bin/bash

# Clear Cache and Restart Dev Server Script
# This script clears all build caches and restarts the Vite dev server

echo "🧹 Clearing all caches..."

# Clear Vite cache
if [ -d "node_modules/.vite" ]; then
  echo "  ✓ Removing node_modules/.vite"
  rm -rf node_modules/.vite
fi

# Clear dist folder if exists
if [ -d "dist" ]; then
  echo "  ✓ Removing dist/"
  rm -rf dist
fi

# Clear TypeScript build info
if [ -f "tsconfig.tsbuildinfo" ]; then
  echo "  ✓ Removing tsconfig.tsbuildinfo"
  rm -f tsconfig.tsbuildinfo
fi

echo ""
echo "✅ Cache cleared successfully!"
echo ""
echo "📝 Next steps:"
echo "   1. Close ALL browser tabs with localhost:5173"
echo "   2. Run: npm run dev"
echo "   3. Open a NEW browser tab (or use Incognito)"
echo "   4. Navigate to: http://localhost:5173/signup"
echo "   5. Press Ctrl+Shift+R to hard refresh"
echo ""
echo "🎯 Expected behavior:"
echo "   - /signup should show ONLY phone input (no email, no passcode)"
echo "   - After entering 10 digits, should redirect to /onboarding"
echo "   - /onboarding should show 8-step wizard starting with 'Shop Details'"
echo ""
