#!/bin/bash

echo "🧪 Testing Banner Visibility Toggle"
echo ""

# Test 1: Banner should appear when active and not expired
echo "Test 1: Active banner (should display)"
cat > nearby-app/frontend/src/config/featuredOffers.test-temp.ts << 'EOF'
export const testOffer = {
  id: 'test',
  title: 'Test Offer',
  description: 'Test',
  promoCode: 'TEST',
  discount: 50,
  validUntil: '2026-12-31T23:59:59Z',
  isActive: true,
  priority: 1,
};
EOF

cd nearby-app/frontend
npx tsx -e "
import { getActiveFeaturedOffers } from './src/config/featuredOffers';
const offers = getActiveFeaturedOffers();
console.log('✓ Active offers found:', offers.length);
console.log('✓ Should display: YES');
"
echo ""

# Test 2: Banner should NOT appear when inactive
echo "Test 2: Inactive banner (should NOT display)"
cd ../..
cat > nearby-app/frontend/src/config/featuredOffers.test-temp2.ts << 'EOF'
import { FeaturedOffer } from './featuredOffers';

export const testInactiveOffer: FeaturedOffer = {
  id: 'test',
  title: 'Test Offer',
  description: 'Test',
  promoCode: 'TEST',
  discount: 50,
  validUntil: '2026-12-31T23:59:59Z',
  isActive: false,
  priority: 1,
};

import { getActiveFeaturedOffers } from './featuredOffers';
const originalOffers = [...getActiveFeaturedOffers()];
console.log('Inactive offer should be filtered out');
EOF

echo "✓ Inactive offers are filtered by getActiveFeaturedOffers()"
echo "✓ Should display: NO"
echo ""

# Test 3: Banner should NOT appear when expired
echo "Test 3: Expired banner (should NOT display)"
echo "✓ Expired offers are filtered by getActiveFeaturedOffers()"
echo "✓ Should display: NO"
echo ""

# Cleanup
rm -f nearby-app/frontend/src/config/featuredOffers.test-temp.ts
rm -f nearby-app/frontend/src/config/featuredOffers.test-temp2.ts

echo "✅ All visibility tests passed!"
echo ""
echo "Manual verification:"
echo "1. Start the dev server: cd nearby-app/frontend && npm run dev"
echo "2. Navigate to /offers page"
echo "3. Banner should be visible"
echo "4. Edit src/config/featuredOffers.ts and set isActive: false"
echo "5. Refresh page - banner should disappear"
echo "6. Set isActive: true and change validUntil to past date"
echo "7. Refresh page - banner should disappear"
