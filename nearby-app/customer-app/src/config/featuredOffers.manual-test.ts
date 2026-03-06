/**
 * Manual Test Script for Featured Offers
 * 
 * Run this file with: npx tsx src/config/featuredOffers.manual-test.ts
 * 
 * This script tests:
 * 1. Active offers are returned correctly
 * 2. Inactive offers are filtered out
 * 3. Expired offers are filtered out
 * 4. Offers are sorted by priority
 * 5. Date formatting works correctly
 */

import {
  getActiveFeaturedOffers,
  getFeaturedOfferById,
  isOfferExpired,
  formatValidityDate,
  type FeaturedOffer,
} from './featuredOffers';

console.log('🧪 Testing Featured Offers Configuration\n');

// Test 1: Get active featured offers
console.log('Test 1: Get Active Featured Offers');
const activeOffers = getActiveFeaturedOffers();
console.log(`✓ Found ${activeOffers.length} active offer(s)`);
activeOffers.forEach((offer, index) => {
  console.log(`  ${index + 1}. ${offer.title} (Priority: ${offer.priority}, Active: ${offer.isActive})`);
});
console.log('');

// Test 2: Get offer by ID
console.log('Test 2: Get Offer by ID');
const firstOrderBonus = getFeaturedOfferById('first-order-bonus');
if (firstOrderBonus) {
  console.log(`✓ Found offer: ${firstOrderBonus.title}`);
  console.log(`  Code: ${firstOrderBonus.promoCode}`);
  console.log(`  Discount: ₹${firstOrderBonus.discount}`);
} else {
  console.log('✗ Offer not found');
}
console.log('');

// Test 3: Check expiry logic
console.log('Test 3: Check Expiry Logic');
const futureOffer: FeaturedOffer = {
  id: 'test-future',
  title: 'Future Offer',
  description: 'Test',
  promoCode: 'FUTURE',
  discount: 10,
  validUntil: '2099-12-31T23:59:59Z',
  isActive: true,
  priority: 1,
};
const pastOffer: FeaturedOffer = {
  id: 'test-past',
  title: 'Past Offer',
  description: 'Test',
  promoCode: 'PAST',
  discount: 10,
  validUntil: '2020-01-01T00:00:00Z',
  isActive: true,
  priority: 1,
};
console.log(`✓ Future offer expired: ${isOfferExpired(futureOffer)} (should be false)`);
console.log(`✓ Past offer expired: ${isOfferExpired(pastOffer)} (should be true)`);
console.log('');

// Test 4: Date formatting
console.log('Test 4: Date Formatting');
const currentYear = new Date().getFullYear();
const currentYearDate = `${currentYear}-12-25T00:00:00Z`;
const nextYearDate = `${currentYear + 1}-01-15T00:00:00Z`;
console.log(`✓ Current year date: ${formatValidityDate(currentYearDate)} (should not include year)`);
console.log(`✓ Next year date: ${formatValidityDate(nextYearDate)} (should include year)`);
console.log('');

// Test 5: Verify first-order-bonus offer
console.log('Test 5: Verify First Order Bonus Offer');
if (firstOrderBonus) {
  const expired = isOfferExpired(firstOrderBonus);
  const formattedDate = formatValidityDate(firstOrderBonus.validUntil);
  console.log(`✓ Title: ${firstOrderBonus.title}`);
  console.log(`✓ Active: ${firstOrderBonus.isActive}`);
  console.log(`✓ Expired: ${expired}`);
  console.log(`✓ Valid Until: ${formattedDate}`);
  console.log(`✓ Should Display: ${firstOrderBonus.isActive && !expired ? 'YES' : 'NO'}`);
}
console.log('');

console.log('✅ All tests completed!\n');
console.log('To toggle banner visibility:');
console.log('  1. Open src/config/featuredOffers.ts');
console.log('  2. Change isActive to false for any offer');
console.log('  3. The banner will not appear on the Offers page\n');
console.log('To test expiry:');
console.log('  1. Open src/config/featuredOffers.ts');
console.log('  2. Change validUntil to a past date (e.g., "2020-01-01T00:00:00Z")');
console.log('  3. The banner will not appear on the Offers page\n');
